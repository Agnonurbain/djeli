// src/app/api/parent/boost/route.ts

/**
 * Envoi d'un message d'encouragement parent → élève.
 *
 * Version base minimale : le message n'est PAS persisté en DB. Il est envoyé
 * directement au numéro de téléphone de l'élève via WhatsApp (fallback SMS
 * plus tard si besoin). On privilégie WhatsApp parce que c'est le canal le
 * plus utilisé en CI et que les messages Twilio WhatsApp sont moins chers
 * que les SMS internationaux.
 *
 * Sécurité :
 *   - Auth Supabase requise
 *   - Rôle = parent
 *   - Lien parent_links.confirmed = true avec studentId cible
 *
 * Formatage : on préfixe le message d'un emoji + préfixe "[Parent]" pour
 * que l'élève comprenne le contexte d'où vient le message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parentBoostSchema } from '@/lib/utils/validators';
import { sendWhatsApp } from '@/lib/notifications/twilio';

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

  const parseResult = parentBoostSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? 'Données invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { studentId, message } = parseResult.data;

  // Vérifier que l'utilisateur est parent ET a un lien confirmé avec l'élève
  const [userRow, linkRow] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase
      .from('parent_links')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .eq('confirmed', true)
      .maybeSingle(),
  ]);

  if (userRow.data?.role !== 'parent') {
    return NextResponse.json(
      { error: 'Seul un parent peut envoyer un encouragement.', code: 'ROLE_FORBIDDEN' },
      { status: 403 }
    );
  }

  if (!linkRow.data) {
    return NextResponse.json(
      { error: 'Aucun lien confirmé avec cet élève.', code: 'LINK_FORBIDDEN' },
      { status: 403 }
    );
  }

  // Récupérer le numéro de l'élève (bypass RLS via service du point de vue
  // parent : la RLS sur users n'est pas activée dans migration 001).
  const { data: studentRow } = await supabase
    .from('users')
    .select('phone')
    .eq('id', studentId)
    .single();

  if (!studentRow?.phone) {
    return NextResponse.json(
      { error: 'Numéro de l\'élève introuvable.', code: 'STUDENT_PHONE_MISSING' },
      { status: 404 }
    );
  }

  const formatted = `💬 Message de tes parents :\n${message}\n\n— Envoyé via Djeli`;
  const result = await sendWhatsApp(studentRow.phone, formatted);

  if (!result.success) {
    return NextResponse.json(
      {
        error: `Échec de l'envoi : ${result.error ?? 'erreur inconnue'}`,
        code: 'SEND_FAILED',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    simulated: result.simulated ?? false,
  });
}
