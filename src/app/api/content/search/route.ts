// src/app/api/content/search/route.ts

/**
 * Recherche de contenus pédagogiques.
 *
 * POST { query, subject?, level? }
 *
 * Deux modes :
 *   1. Si GOOGLE_AI_API_KEY est configurée : recherche sémantique RAG
 *      (embed query → pgvector cosine similarity).
 *   2. Sinon : recherche textuelle simple (ILIKE sur title + content),
 *      filtrée par subject/level si fournis.
 *
 * Utilisé par l'élève pour explorer les cours disponibles en dehors
 * du chat. Le chat utilise directement le pipeline rag.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { embedQuery, searchContent } from '@/lib/ai/rag';
import type { Database } from '@/types/database';

const searchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'La recherche ne peut pas être vide')
    .max(300, 'Recherche trop longue'),
  subject: z.string().max(50).optional(),
  level: z.string().max(10).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentification requise.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parseResult = searchSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? 'Données invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { query, subject, level, limit: maxResults } = parseResult.data;
  const resultLimit = maxResults ?? 5;

  // Tenter la recherche vectorielle
  const embedding = await embedQuery(query);

  if (embedding.length > 0) {
    const documents = await searchContent(
      embedding,
      level ?? '',
      subject ?? '',
      resultLimit
    );

    return NextResponse.json({
      query,
      results: documents,
      totalResults: documents.length,
      mode: 'semantic',
    });
  }

  // Fallback textuel si pas d'embedding (clé API absente ou erreur)
  let dbQuery = supabase
    .from('curriculum_content')
    .select('id, title, content, subject, topic, level')
    .limit(resultLimit);

  if (subject) {
    dbQuery = dbQuery.eq('subject', subject);
  }
  if (level) {
    dbQuery = dbQuery.eq('level', level as Database['public']['Enums']['student_level']);
  }

  // Recherche ILIKE sur titre
  dbQuery = dbQuery.ilike('title', `%${query}%`);

  const { data: rows, error: dbError } = await dbQuery;

  if (dbError) {
    console.error('[content/search] DB error:', dbError);
    return NextResponse.json(
      { error: 'Erreur de recherche.', code: 'SEARCH_FAILED' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    query,
    results: (rows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      similarity: null,
    })),
    totalResults: rows?.length ?? 0,
    mode: 'text',
  });
}
