// src/app/api/chat/route.ts

/**
 * Route API de chat avec streaming SSE.
 *
 * Flux :
 *   1. Valider le message avec Zod
 *   2. Authentifier l'élève via Supabase
 *   3. Charger le profil élève (niveau, xp)
 *   4. Charger ou créer la session de chat
 *   5. Récupérer le niveau de maîtrise du sujet en cours
 *   6. Exécuter le pipeline RAG pour le contexte programme
 *   7. Construire le system prompt dynamique
 *   8. Streamer la réponse Gemini 1.5 Pro via SSE
 *   9. Sauvegarder le message + la réponse dans la session
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { chatMessageSchema } from "@/lib/utils/validators";
import { buildSystemPrompt } from "@/lib/ai/prompts/system";
import { ragPipeline } from "@/lib/ai/rag";
import type { RAGContext } from "@/lib/ai/rag";
import type { Mastery, Message } from "@/types/chat";
import type { StudentLevel } from "@/types/curriculum";
import type { Json } from "@/types/database";

// Nombre maximum de messages d'historique envoyés à Gemini
const MAX_HISTORY_MESSAGES = 10;

/**
 * Formate le contexte RAG en texte injectable dans le prompt.
 * Chaque document est présenté avec son titre et son contenu.
 */
function formatRAGContext(ragContext: RAGContext): string {
  if (ragContext.documents.length === 0) {
    return "";
  }

  const formattedDocs = ragContext.documents
    .map(
      (doc, index) =>
        `### Document ${index + 1} : ${doc.title}\n${doc.content}`
    )
    .join("\n\n");

  return `## Contexte du programme scolaire\n\n${formattedDocs}`;
}

/**
 * Construit l'historique de conversation au format Gemini (contents).
 * Mappe les rôles : 'user' → 'user', 'assistant' → 'model'.
 * Ne prend que les derniers MAX_HISTORY_MESSAGES messages.
 */
function buildConversationHistory(
  messages: Message[]
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  // Filtrer les messages système et ne garder que user/assistant
  const filteredMessages = messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES);

  return filteredMessages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));
}

/**
 * Sérialise un tableau de Messages en Json compatible avec la colonne Supabase.
 */
function serializeMessages(messages: Message[]): Json {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
    ...(msg.metadata ? { metadata: msg.metadata as Json } : {}),
  })) as Json;
}

/**
 * Désérialise les données JSON de la colonne messages en tableau de Message.
 */
function deserializeMessages(data: Json | null): Message[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: record.id as string,
      role: record.role as Message["role"],
      content: record.content as string,
      timestamp: new Date(record.timestamp as string),
      metadata: record.metadata as Record<string, unknown> | undefined,
    };
  });
}

export async function POST(request: NextRequest) {
  // Vérifier que la clé API Gemini est configurée
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      {
        error: "La clé API Google AI n'est pas configurée sur le serveur.",
        code: "AI_CONFIG_ERROR",
      },
      { status: 500 }
    );
  }

  // 1. Valider le body de la requête avec Zod
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Le corps de la requête est invalide.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const parseResult = chatMessageSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return NextResponse.json(
      {
        error: firstError?.message ?? "Données invalides.",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  const { content: userMessage, sessionId, subject, topic } = parseResult.data;

  // 2. Authentifier l'utilisateur via Supabase
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "Vous devez être connecté pour utiliser le chat.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  // 3. Charger le profil élève (niveau, xp)
  const { data: studentProfile, error: profileError } = await supabase
    .from("student_profiles")
    .select("level, xp")
    .eq("user_id", user.id)
    .single();

  if (profileError || !studentProfile) {
    return NextResponse.json(
      {
        error: "Profil élève introuvable. Complétez votre inscription.",
        code: "PROFILE_NOT_FOUND",
      },
      { status: 400 }
    );
  }

  const studentLevel = studentProfile.level as StudentLevel;

  // 4. Charger ou créer la session de chat
  let chatSessionId = sessionId;
  let existingMessages: Message[] = [];

  if (chatSessionId) {
    // Charger la session existante
    const { data: existingSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, messages")
      .eq("id", chatSessionId)
      .eq("student_id", user.id)
      .single();

    if (sessionError || !existingSession) {
      return NextResponse.json(
        {
          error: "Session de chat introuvable.",
          code: "SESSION_NOT_FOUND",
        },
        { status: 400 }
      );
    }

    existingMessages = deserializeMessages(existingSession.messages);
  } else {
    // Créer une nouvelle session
    const { data: newSession, error: createError } = await supabase
      .from("chat_sessions")
      .insert({
        student_id: user.id,
        subject: subject ?? null,
        topic: topic ?? null,
        messages: [] as Json,
      })
      .select("id")
      .single();

    if (createError || !newSession) {
      return NextResponse.json(
        {
          error: "Impossible de créer la session de chat.",
          code: "SESSION_CREATE_ERROR",
        },
        { status: 500 }
      );
    }

    chatSessionId = newSession.id;
  }

  // Matière et topic effectifs (priorité au body, puis à la session)
  const effectiveSubject = subject ?? "general";
  const effectiveTopic = topic ?? "";

  // 5. Récupérer le niveau de maîtrise pour la matière/topic
  let mastery: Mastery = "novice";

  if (effectiveSubject !== "general" && effectiveTopic) {
    const { data: masteryData } = await supabase
      .from("mastery_tree")
      .select("mastery_level")
      .eq("student_id", user.id)
      .eq("subject", effectiveSubject)
      .eq("topic", effectiveTopic)
      .single();

    if (masteryData?.mastery_level) {
      mastery = masteryData.mastery_level as Mastery;
    }
  }

  // 6. Exécuter le pipeline RAG pour récupérer le contexte programme
  let ragContextText = "";
  try {
    const ragResult = await ragPipeline(
      userMessage,
      studentLevel,
      effectiveSubject
    );
    ragContextText = formatRAGContext(ragResult);
  } catch {
    // Le pipeline RAG peut échouer (pas encore implémenté, ou erreur réseau).
    // On continue sans contexte RAG — l'IA répondra avec ses connaissances.
    console.warn(
      "[chat] Pipeline RAG indisponible, continuation sans contexte enrichi."
    );
  }

  // 7. Construire le system prompt dynamique
  const systemPromptBase = buildSystemPrompt({
    level: studentLevel,
    subject: effectiveSubject,
    emotionalState: "neutre",
    mastery,
  });

  // Injecter le contexte RAG dans le system prompt
  const systemPrompt = ragContextText
    ? `${systemPromptBase}\n\n${ragContextText}`
    : systemPromptBase;

  // 8. Préparer le streaming SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Construire l'historique de conversation pour Gemini
  const conversationHistory = buildConversationHistory(existingMessages);

  // Ajouter le message actuel de l'utilisateur
  const contents = [
    ...conversationHistory,
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  // Créer le message utilisateur pour la sauvegarde
  const userMsg: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  };

  // Lancer le streaming Gemini en arrière-plan
  const streamingTask = (async () => {
    let fullResponse = "";

    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const result = await model.generateContentStream({
        contents,
        systemInstruction: systemPrompt,
      });

      // Streamer chaque chunk via SSE
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ content: text })}\n\n`
            )
          );
        }
      }

      // Envoyer l'événement de fin avec l'ID de session
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, sessionId: chatSessionId })}\n\n`
        )
      );
    } catch (error) {
      // Envoyer l'erreur au client via SSE
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue avec l'IA.";
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ error: errorMessage, code: "AI_STREAM_ERROR" })}\n\n`
        )
      );
    } finally {
      // 9. Sauvegarder les messages dans la session après le streaming
      if (fullResponse) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullResponse,
          timestamp: new Date(),
        };

        const updatedMessages = [...existingMessages, userMsg, assistantMsg];

        await supabase
          .from("chat_sessions")
          .update({
            messages: serializeMessages(updatedMessages),
            updated_at: new Date().toISOString(),
          })
          .eq("id", chatSessionId!);
      }

      await writer.close();
    }
  })();

  // Ne pas bloquer la réponse — le streaming se fait en parallèle
  // L'erreur non gérée est capturée dans le bloc try/catch interne
  void streamingTask;

  // Retourner le flux SSE au client
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
