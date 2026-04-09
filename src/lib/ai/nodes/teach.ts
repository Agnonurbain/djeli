// src/lib/ai/nodes/teach.ts

/**
 * Noeud enseignement socratique + RAG.
 *
 * Ce noeud :
 * 1. Récupère le contexte pertinent via le pipeline RAG (pgvector)
 * 2. Construit un prompt adapté au niveau de l'élève
 * 3. Génère une explication socratique via Gemini en streaming
 * 4. Utilise des analogies locales ivoiriennes pour ancrer les concepts
 *
 * Le ton s'adapte : ludique (collège), structuré (lycée), expert (université).
 */

import type { AgentState } from '@/types/chat';

/**
 * Génère une explication pédagogique en mode socratique.
 */
export async function teachNode(_state: AgentState): Promise<Partial<AgentState>> {
  // TODO: Pipeline RAG → construction prompt → Gemini streaming
  // 1. ragPipeline(state.lastMessage)
  // 2. buildSystemPrompt(state.level, state.subject, state.emotionalState, state.mastery)
  // 3. Gemini 1.5 Pro streaming
  // 4. Retourner la réponse dans l'état

  throw new Error('Teach node non implémenté');
}
