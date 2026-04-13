// src/app/api/progress/route.ts

/**
 * CRUD progression / arbre de maîtrise.
 *
 * GET  : retourne le profil (xp, niveau, streak) + l'arbre de maîtrise complet
 *        de l'élève connecté. Côté client, ces données alimentent la page /arbre
 *        et la XPBar globale.
 *
 * POST : enregistre le résultat d'un exercice terminé (QCM, calcul, rédaction,
 *        photo). Met à jour le score le plus récent, incrémente le compteur
 *        d'exercices validés, fait progresser le palier de maîtrise si besoin,
 *        et ajoute les XP correspondants au profil.
 *
 * Sécurité : l'auth Supabase est vérifiée en premier. RLS côté DB garantit
 * qu'un élève ne peut lire/écrire que ses propres lignes mastery_tree.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { progressUpdateSchema } from '@/lib/utils/validators';
import {
  calculateLevel,
  getLevelProgress,
  nextMasteryLevel,
  xpRewardForExercise,
} from '@/lib/progress/xp';
import type { Mastery } from '@/types/chat';

/**
 * Ligne de l'arbre de maîtrise retournée au client.
 * On renomme les colonnes en camelCase pour rester cohérent avec les types TS.
 */
interface MasteryNodeDTO {
  id: string;
  subject: string;
  topic: string;
  masteryLevel: Mastery;
  exercisesCompleted: number;
  lastScore: number | null;
  updatedAt: string | null;
}

/**
 * GET /api/progress
 * Retourne la progression complète de l'élève connecté.
 */
export async function GET(_request: NextRequest) {
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

  // Charger le profil (xp, streak) et l'arbre de maîtrise en parallèle.
  const [profileResult, masteryResult] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('xp, streak_days, level')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('mastery_tree')
      .select(
        'id, subject, topic, mastery_level, exercises_completed, last_score, updated_at'
      )
      .eq('student_id', user.id)
      .order('subject', { ascending: true })
      .order('topic', { ascending: true }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json(
      {
        error: 'Profil élève introuvable. Complète ton inscription.',
        code: 'PROFILE_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const totalXp = profileResult.data.xp ?? 0;
  const levelProgress = getLevelProgress(totalXp);

  const masteryTree: MasteryNodeDTO[] = (masteryResult.data ?? []).map(
    (row) => ({
      id: row.id,
      subject: row.subject,
      topic: row.topic,
      masteryLevel: (row.mastery_level ?? 'novice') as Mastery,
      exercisesCompleted: row.exercises_completed ?? 0,
      lastScore: row.last_score,
      updatedAt: row.updated_at,
    })
  );

  return NextResponse.json({
    studentLevel: profileResult.data.level,
    streakDays: profileResult.data.streak_days ?? 0,
    ...levelProgress,
    masteryTree,
  });
}

/**
 * POST /api/progress
 * Enregistre le résultat d'un exercice terminé :
 *   { subject, topic, exerciseType, score }
 *
 * Étapes :
 *   1. Auth + validation Zod
 *   2. Upsert de la ligne mastery_tree (création si absente)
 *   3. Calcul du nouveau palier + nouveau compteur + nouveau score
 *   4. Incrément des XP du profil
 *   5. Retour de l'état à jour
 */
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

  // 1. Valider le body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parseResult = progressUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return NextResponse.json(
      {
        error: firstError?.message ?? 'Données invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { subject, topic, exerciseType, score } = parseResult.data;

  // 2. Lire la ligne mastery_tree existante (si présente)
  const { data: existingRow } = await supabase
    .from('mastery_tree')
    .select('id, mastery_level, exercises_completed')
    .eq('student_id', user.id)
    .eq('subject', subject)
    .eq('topic', topic)
    .maybeSingle();

  const previousLevel: Mastery =
    (existingRow?.mastery_level as Mastery | undefined) ?? 'novice';
  const previousCompleted = existingRow?.exercises_completed ?? 0;

  // Un exercice "compte" comme validé seulement si le score atteint le seuil.
  // Sinon on garde le compteur, mais on stocke le dernier score pour feedback UI.
  const nextCompleted =
    score >= 0.5 ? previousCompleted + 1 : previousCompleted;
  const newMasteryLevel = nextMasteryLevel(previousLevel, nextCompleted, score);

  // 3. Upsert de la ligne mastery_tree
  const { error: upsertError } = await supabase.from('mastery_tree').upsert(
    {
      student_id: user.id,
      subject,
      topic,
      mastery_level: newMasteryLevel,
      exercises_completed: nextCompleted,
      last_score: score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,subject,topic' }
  );

  if (upsertError) {
    console.error('[progress] upsert mastery_tree failed:', upsertError);
    return NextResponse.json(
      {
        error: 'Impossible de sauvegarder la progression.',
        code: 'MASTERY_UPDATE_FAILED',
      },
      { status: 500 }
    );
  }

  // 4. Incrémenter les XP du profil
  const xpGained = xpRewardForExercise(exerciseType, score);

  const { data: profileBefore } = await supabase
    .from('student_profiles')
    .select('xp')
    .eq('user_id', user.id)
    .single();

  const previousXp = profileBefore?.xp ?? 0;
  const newXp = previousXp + xpGained;

  const { error: profileError } = await supabase
    .from('student_profiles')
    .update({ xp: newXp, last_active_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (profileError) {
    console.error('[progress] update xp failed:', profileError);
    // Non bloquant : la maîtrise a été sauvegardée, on retourne quand même
    // un succès partiel plutôt que de faire rejouer le POST (risque de double-upsert).
  }

  const leveledUp =
    calculateLevel(newXp) > calculateLevel(previousXp);
  const masteryChanged = newMasteryLevel !== previousLevel;

  return NextResponse.json({
    success: true,
    xpGained,
    ...getLevelProgress(newXp),
    masteryLevel: newMasteryLevel,
    exercisesCompleted: nextCompleted,
    leveledUp,
    masteryChanged,
  });
}
