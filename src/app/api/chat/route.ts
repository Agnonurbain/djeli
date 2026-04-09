// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter le streaming LLM via Gemini + LangGraph
// - Vérifier l'authentification de l'élève
// - Valider le message et le contexte de conversation avec Zod
// - Charger le profil élève (niveau, matière, état émotionnel, progression)
// - Construire le system prompt dynamique selon le profil
// - Exécuter le pipeline RAG : embed question → recherche pgvector → injection contexte
// - Streamer la réponse Gemini via SSE (Server-Sent Events)
// - Sauvegarder le message et la réponse dans l'historique

/**
 * Streaming LLM via Gemini + LangGraph
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    message: "Placeholder response from Djeli AI tutor",
    conversationId: "placeholder-id",
  });
}
