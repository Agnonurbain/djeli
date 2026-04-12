// src/lib/ai/nodes/teach.ts

/**
 * Noeud enseignement socratique + RAG.
 *
 * Ce noeud :
 * 1. Récupère le contexte pertinent via le pipeline RAG (pgvector)
 * 2. Construit un prompt adapté au niveau et à l'état émotionnel de l'élève
 * 3. Génère une explication socratique via Gemini 1.5 Pro
 * 4. Le prompt système s'adapte : ludique (collège), structuré (lycée), expert (université)
 *
 * Pour le streaming temps-réel, la route API `/api/chat` appelle directement
 * Gemini en mode stream. Ce noeud LangGraph est utile pour les flux non-streamés
 * (tests, scripts d'évaluation, future orchestration multi-agent).
 */

import { buildSystemPrompt } from '@/lib/ai/prompts/system';
import { ragPipeline, formatRAGContext } from '@/lib/ai/rag';
import { getGeminiModel, type DjeliState } from '@/lib/ai/agent';
import { GEMINI_SMART_MODEL } from '@/lib/ai/models';
import type { Message } from '@/types/chat';
import type { StudentLevel } from '@/types/curriculum';

/** Nombre maximum de messages d'historique envoyés à Gemini */
const MAX_HISTORY_MESSAGES = 10;

/**
 * Mappe les messages du state vers le format attendu par Gemini :
 * `user` → `user`, `assistant` → `model`. Ignore les messages système.
 */
function buildConversationHistory(
  messages: Message[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  return messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    }));
}

/**
 * Génère une explication pédagogique en mode socratique.
 *
 * Étapes :
 *   1. RAG → récupérer le contexte du programme ivoirien
 *   2. Construction du system prompt dynamique (niveau + émotion + maîtrise)
 *   3. Appel Gemini 1.5 Pro (qualité pédagogique)
 *   4. Retour de la réponse et du contexte RAG dans l'état
 */
export async function teachNode(
  state: DjeliState
): Promise<Partial<DjeliState>> {
  // 1. Pipeline RAG pour enrichir le contexte avec le programme scolaire
  const ragResult = await ragPipeline(
    state.lastUserMessage,
    state.level,
    state.subject
  );
  const ragContextText = formatRAGContext(ragResult);

  // 2. Construire le system prompt adapté à l'élève
  const systemPromptBase = buildSystemPrompt({
    level: state.level as StudentLevel,
    subject: state.subject,
    emotionalState: state.emotionalState,
    mastery: state.mastery,
  });

  const systemPrompt = ragContextText
    ? `${systemPromptBase}\n\n${ragContextText}`
    : systemPromptBase;

  // 3. Appel du modèle Gemini "smart" (qualité pédagogique)
  const model = getGeminiModel(GEMINI_SMART_MODEL);

  // Si l'API n'est pas configurée, on retourne une réponse de secours
  if (!model) {
    return {
      ragContext: ragContextText,
      response:
        "Je ne peux pas répondre pour le moment — le service IA n'est pas configuré. " +
        "Réessaie dans quelques instants.",
    };
  }

  // Construire l'historique + le message courant
  const history = buildConversationHistory(state.messages);
  const contents = [
    ...history,
    { role: 'user' as const, parts: [{ text: state.lastUserMessage }] },
  ];

  try {
    const result = await model.generateContent({
      contents,
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();

    return {
      ragContext: ragContextText,
      response: responseText,
    };
  } catch (error) {
    console.error(
      '[Teach] Erreur Gemini :',
      error instanceof Error ? error.message : error
    );
    return {
      ragContext: ragContextText,
      response:
        "Une erreur est survenue avec l'IA. Réessaie ta question, s'il te plaît.",
    };
  }
}
