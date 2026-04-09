// src/lib/ai/rag.ts

/**
 * Pipeline RAG : embed question → recherche pgvector → injection contexte → Gemini streaming.
 *
 * Étapes :
 *   1. Embedding de la question via Gemini Embedding API
 *   2. Recherche vectorielle pgvector → top 5 contenus du programme ivoirien
 *   3. Injection du contexte dans le system prompt + historique (10 derniers messages)
 *   4. Gemini 1.5 Pro génère la réponse en streaming
 *   5. Réponse affichée sur le Tableau Noir avec rendu LaTeX/code
 */

// TODO: import { GoogleGenerativeAI } from '@google/generative-ai';
// TODO: import { createClient } from '@/lib/supabase/server';

export interface RAGContext {
  /** Contenus récupérés depuis pgvector, triés par similarité */
  documents: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
  /** Question originale de l'élève */
  query: string;
}

/**
 * Génère l'embedding d'une question via Gemini Embedding API.
 */
export async function embedQuery(_query: string): Promise<number[]> {
  // TODO: Appeler Gemini Embedding API
  // const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  // const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  // const result = await model.embedContent(query);
  // return result.embedding.values;
  throw new Error('RAG embedQuery non implémenté');
}

/**
 * Recherche les contenus les plus pertinents via pgvector.
 */
export async function searchContent(
  _embedding: number[],
  _limit: number = 5
): Promise<RAGContext['documents']> {
  // TODO: Requête pgvector via Supabase
  // SELECT id, title, content, 1 - (embedding <=> $1) AS similarity
  // FROM curriculum_content
  // ORDER BY embedding <=> $1
  // LIMIT $2;
  throw new Error('RAG searchContent non implémenté');
}

/**
 * Pipeline RAG complet : question → contexte enrichi.
 */
export async function ragPipeline(_query: string): Promise<RAGContext> {
  // TODO: Chaîner embedQuery → searchContent → construire le contexte
  throw new Error('RAG pipeline non implémenté');
}
