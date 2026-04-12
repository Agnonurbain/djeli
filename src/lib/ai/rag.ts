// src/lib/ai/rag.ts

/**
 * Pipeline RAG : embed question → recherche pgvector → injection contexte → Gemini streaming.
 *
 * Étapes :
 *   1. Embedding de la question via Gemini Embedding API (text-embedding-004)
 *   2. Recherche vectorielle pgvector → top N contenus du programme ivoirien
 *   3. Construction du contexte enrichi pour le system prompt
 *
 * Gestion d'erreurs gracieuse : si l'API key est absente ou la base vide,
 * le pipeline retourne un contexte vide plutôt que de planter.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { GEMINI_EMBEDDING_MODEL } from '@/lib/ai/models';
import type { Database } from '@/types/database';

/** Niveaux scolaires valides du programme ivoirien */
type StudentLevel = Database['public']['Enums']['student_level'];

/** Nombre de documents récupérés par défaut */
const DEFAULT_MATCH_COUNT = 5;

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
 * Résultat brut retourné par la fonction SQL match_curriculum_content.
 * Utilisé pour typer le retour de l'appel RPC Supabase.
 */
interface MatchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

/**
 * Génère l'embedding d'une question via Gemini Embedding API.
 *
 * Utilise le modèle text-embedding-004 (dimension 768) compatible
 * avec la colonne VECTOR(768) de curriculum_content.
 *
 * @returns Le vecteur d'embedding, ou un tableau vide si la clé API est absente.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn(
      '[RAG] GOOGLE_AI_API_KEY non définie — embedding impossible, retour vide.'
    );
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });

    const result = await model.embedContent(query);
    return result.embedding.values;
  } catch (error) {
    console.error('[RAG] Erreur lors de la génération de l\'embedding :', error);
    return [];
  }
}

/**
 * Recherche les contenus les plus pertinents via pgvector (similarité cosinus).
 *
 * Tente d'abord un appel à la fonction SQL match_curriculum_content
 * (recherche vectorielle optimisée). En cas d'échec (fonction inexistante,
 * erreur réseau), bascule sur une requête directe filtrée par niveau et matière.
 *
 * @param embedding - Vecteur d'embedding de la question (dimension 768)
 * @param level - Niveau scolaire de l'élève (ex: "6eme", "tle", "l1")
 * @param subject - Matière concernée (ex: "mathematiques", "physique")
 * @param limit - Nombre maximum de résultats (défaut : 5)
 */
export async function searchContent(
  embedding: number[],
  level: string,
  subject: string,
  limit: number = DEFAULT_MATCH_COUNT
): Promise<RAGContext['documents']> {
  // Si l'embedding est vide, on ne peut pas faire de recherche vectorielle
  if (embedding.length === 0) {
    console.warn(
      '[RAG] Embedding vide — recherche vectorielle impossible, retour vide.'
    );
    return [];
  }

  try {
    const supabase = await createClient();

    // Tentative via la fonction SQL match_curriculum_content (recherche vectorielle).
    // La fonction n'est pas encore déclarée dans les types générés Supabase,
    // donc on utilise un cast pour contourner le typage strict.
    // À retirer une fois `npx supabase gen types typescript` relancé après création de la fonction SQL.
    type RpcCallFn = (
      fn: string,
      params: Record<string, unknown>
    ) => Promise<{
      data: MatchResult[] | null;
      error: { message: string } | null;
    }>;
    const rpcCall = supabase.rpc as unknown as RpcCallFn;
    const { data: rpcData, error: rpcError } = await rpcCall(
      'match_curriculum_content',
      {
        query_embedding: JSON.stringify(embedding),
        match_count: limit,
        filter_level: level,
        filter_subject: subject,
      }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      // La fonction RPC a retourné des résultats
      return rpcData.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        similarity: doc.similarity,
      }));
    }

    // Fallback : requête directe sans recherche vectorielle
    // Utilisé quand la fonction SQL n'existe pas encore ou échoue
    if (rpcError) {
      console.warn(
        '[RAG] Fonction match_curriculum_content indisponible, fallback sur requête directe :',
        rpcError.message
      );
    }

    return await fallbackSearch(level, subject, limit);
  } catch (error) {
    console.error('[RAG] Erreur lors de la recherche de contenu :', error);
    return [];
  }
}

/**
 * Recherche de secours sans similarité vectorielle.
 *
 * Filtre par niveau et matière, retourne les contenus les plus récents.
 * Le score de similarité est fixé à 0 car aucun calcul vectoriel n'est effectué.
 */
async function fallbackSearch(
  level: string,
  subject: string,
  limit: number
): Promise<RAGContext['documents']> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('curriculum_content')
      .select('id, title, content')
      .eq('level', level as StudentLevel)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[RAG] Erreur fallback search :', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      // Base de données vide pour ce niveau/matière — comportement normal au démarrage
      return [];
    }

    // Score de similarité à 0 car pas de calcul vectoriel dans le fallback
    return data.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      similarity: 0,
    }));
  } catch (error) {
    console.error('[RAG] Erreur fallback search :', error);
    return [];
  }
}

/**
 * Pipeline RAG complet : question → contexte enrichi.
 *
 * Chaîne les étapes embedding → recherche vectorielle → construction du contexte.
 * Retourne un contexte vide (avec la question) si une étape échoue,
 * plutôt que de faire planter l'application.
 *
 * @param query - Question posée par l'élève
 * @param level - Niveau scolaire (ex: "3eme", "1ere", "l2")
 * @param subject - Matière (ex: "mathematiques", "francais")
 */
export async function ragPipeline(
  query: string,
  level: string,
  subject: string
): Promise<RAGContext> {
  // Étape 1 : Générer l'embedding de la question
  const embedding = await embedQuery(query);

  // Étape 2 : Rechercher les contenus les plus pertinents
  const documents = await searchContent(embedding, level, subject);

  // Étape 3 : Construire le contexte enrichi
  return {
    documents,
    query,
  };
}

/**
 * Formate le contexte RAG en texte injectable dans le system prompt.
 *
 * Les documents sont numérotés et présentés avec leur titre et score
 * de pertinence pour aider le LLM à prioriser les sources.
 * Si aucun document n'est trouvé, retourne une indication explicite
 * pour que le LLM adapte sa réponse en conséquence.
 *
 * @param context - Contexte RAG contenant les documents récupérés
 * @returns Texte formaté prêt à être injecté dans le prompt système
 */
export function formatRAGContext(context: RAGContext): string {
  if (context.documents.length === 0) {
    return (
      '--- Contexte du programme ---\n' +
      'Aucun contenu du programme ivoirien trouvé pour cette question.\n' +
      'Réponds en te basant sur tes connaissances générales, ' +
      'en restant aligné avec le programme scolaire ivoirien.\n' +
      '---'
    );
  }

  const header = `--- Contexte du programme (${context.documents.length} source${context.documents.length > 1 ? 's' : ''}) ---`;

  const formattedDocs = context.documents
    .map((doc, index) => {
      const similarityPercent = Math.round(doc.similarity * 100);
      return (
        `[${index + 1}] ${doc.title} (pertinence : ${similarityPercent}%)\n` +
        doc.content
      );
    })
    .join('\n\n');

  const footer = '---';

  return `${header}\n\n${formattedDocs}\n\n${footer}`;
}
