// src/app/api/parent/report/route.ts

/**
 * Génération de rapport hebdomadaire parent.
 *
 * Agrège, pour l'élève passé en paramètre :
 *   - nombre de chapitres travaillés cette semaine (mastery_tree.updated_at)
 *   - progression de palier (si un chapitre a changé de palier cette semaine)
 *   - sessions de chat sur la semaine (chat_sessions)
 *   - XP actuel + streak depuis student_profiles
 *
 * Produit un résumé texte court en français, prêt à être envoyé sur WhatsApp
 * via ?send=whatsapp. En l'absence de Gemini ou pour garder la logique minimale,
 * on compose le message à la main — pas besoin d'un LLM pour une phrase
 * factuelle. Gemini pourra être branché plus tard si on veut plus de nuance.
 *
 * Sécurité : RLS garantit que le parent voit uniquement les enfants liés
 * (policy "parents_read_children_profile"/"parents_read_children_mastery").
 * On vérifie quand même explicitement le lien en amont pour renvoyer 403
 * plutôt que 404 + liste vide.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parentReportQuerySchema } from '@/lib/utils/validators';
import { sendWhatsApp } from '@/lib/notifications/twilio';
import { MASTERY_LABELS } from '@/lib/progress/xp';
import type { Mastery } from '@/types/chat';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Compose un résumé texte humain du rapport. Volontairement court
 * pour tenir sur un écran WhatsApp.
 */
function composeSummary(input: {
  displayName: string;
  level: string;
  exercisesThisWeek: number;
  averageScore: number | null;
  bestTopic: { topic: string; masteryLevel: Mastery } | null;
  xp: number;
  streakDays: number;
  chatSessions: number;
}): string {
  const lines: string[] = [];
  const name = input.displayName || 'votre enfant';

  lines.push(`📚 Rapport hebdo Djeli — ${name} (${input.level})`);

  if (input.exercisesThisWeek === 0 && input.chatSessions === 0) {
    lines.push(
      "Aucune activité cette semaine. Un petit rappel pourrait l'aider à reprendre !"
    );
  } else {
    lines.push(
      `• ${input.exercisesThisWeek} exercice${input.exercisesThisWeek > 1 ? 's' : ''} validé${
        input.exercisesThisWeek > 1 ? 's' : ''
      } · ${input.chatSessions} discussion${input.chatSessions > 1 ? 's' : ''} avec Prof Chibi`
    );

    if (input.averageScore !== null) {
      lines.push(`• Score moyen : ${Math.round(input.averageScore * 100)}%`);
    }

    if (input.bestTopic) {
      lines.push(
        `• Meilleur chapitre : ${input.bestTopic.topic} (${MASTERY_LABELS[input.bestTopic.masteryLevel]})`
      );
    }
  }

  lines.push(`🔥 Série : ${input.streakDays} jour${input.streakDays > 1 ? 's' : ''} · ${input.xp} XP total`);

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
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

  // Validation des query params
  const { searchParams } = new URL(request.url);
  const parseResult = parentReportQuerySchema.safeParse({
    studentId: searchParams.get('studentId'),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? 'Paramètres invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { studentId } = parseResult.data;
  const sendWhatsAppParam = searchParams.get('send') === 'whatsapp';

  // Vérifier que le parent a un lien confirmé avec cet élève
  const { data: link } = await supabase
    .from('parent_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .eq('confirmed', true)
    .maybeSingle();

  if (!link) {
    return NextResponse.json(
      { error: 'Aucun lien confirmé avec cet élève.', code: 'LINK_FORBIDDEN' },
      { status: 403 }
    );
  }

  const since = new Date(Date.now() - WEEK_MS).toISOString();

  const [profileResult, masteryResult, chatResult] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('display_name, level, xp, streak_days')
      .eq('user_id', studentId)
      .single(),
    supabase
      .from('mastery_tree')
      .select('subject, topic, mastery_level, exercises_completed, last_score, updated_at')
      .eq('student_id', studentId)
      .gte('updated_at', since),
    supabase
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .gte('updated_at', since),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json(
      { error: 'Profil enfant introuvable.', code: 'PROFILE_NOT_FOUND' },
      { status: 404 }
    );
  }

  const profile = profileResult.data;
  const masteryRows = masteryResult.data ?? [];
  const chatSessions = chatResult.count ?? 0;

  // Agrégations
  const exercisesThisWeek = masteryRows.reduce(
    (acc, row) => acc + (row.exercises_completed ?? 0),
    0
  );

  const scored = masteryRows
    .map((r) => r.last_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const averageScore =
    scored.length > 0
      ? scored.reduce((a, b) => a + b, 0) / scored.length
      : null;

  // Chapitre "meilleur" : palier le plus haut atteint cette semaine
  const MASTERY_WEIGHT: Record<Mastery, number> = {
    novice: 0,
    apprenti: 1,
    confirme: 2,
    expert: 3,
    maitre: 4,
  };
  const bestTopic = masteryRows.reduce<
    { topic: string; masteryLevel: Mastery } | null
  >((acc, row) => {
    const level = (row.mastery_level ?? 'novice') as Mastery;
    if (!acc || MASTERY_WEIGHT[level] > MASTERY_WEIGHT[acc.masteryLevel]) {
      return { topic: row.topic, masteryLevel: level };
    }
    return acc;
  }, null);

  // Période : semaine ISO (YYYY-Wnn) de la date courante
  const now = new Date();
  const period = `${now.getUTCFullYear()}-W${String(getIsoWeekNumber(now)).padStart(2, '0')}`;

  const summary = composeSummary({
    displayName: profile.display_name ?? 'votre enfant',
    level: profile.level,
    exercisesThisWeek,
    averageScore,
    bestTopic,
    xp: profile.xp ?? 0,
    streakDays: profile.streak_days ?? 0,
    chatSessions,
  });

  // Envoi WhatsApp optionnel (?send=whatsapp)
  let whatsappResult: { success: boolean; simulated?: boolean; error?: string } | null = null;
  if (sendWhatsAppParam) {
    // Récupérer le numéro du parent (l'utilisateur connecté)
    const { data: parentRow } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .single();

    if (parentRow?.phone) {
      whatsappResult = await sendWhatsApp(parentRow.phone, summary);
    } else {
      whatsappResult = { success: false, error: 'Numéro parent introuvable.' };
    }
  }

  return NextResponse.json({
    studentId,
    studentName: profile.display_name,
    level: profile.level,
    period,
    exercisesThisWeek,
    averageScore,
    bestTopic,
    chatSessions,
    xp: profile.xp ?? 0,
    streakDays: profile.streak_days ?? 0,
    summary,
    whatsapp: whatsappResult,
  });
}

/**
 * Calcule le numéro de semaine ISO 8601 d'une date.
 * Référence : ISO 8601 — la semaine 1 est celle qui contient le jeudi 4 janvier.
 */
function getIsoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
