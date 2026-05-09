// src/app/api/subscription/route.ts

/**
 * Statut d'abonnement de l'utilisateur connecté.
 *
 * GET retourne :
 *   - isPremium + premiumExpiresAt
 *   - remainingInteractions (quota quotidien pour le plan gratuit)
 *
 * Le quota est calculé en comptant les chat_sessions créées aujourd'hui.
 * Les utilisateurs premium ont un quota infini.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/payment/plans';

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

  const { data: userRow } = await supabase
    .from('users')
    .select('is_premium, premium_expires_at')
    .eq('id', user.id)
    .single();

  const now = new Date();
  const premiumExpiresAt = userRow?.premium_expires_at
    ? new Date(userRow.premium_expires_at)
    : null;

  // Le premium est actif si le flag est true ET la date d'expiration est dans le futur
  const isPremium =
    !!userRow?.is_premium &&
    (premiumExpiresAt === null || premiumExpiresAt > now);

  let remainingInteractions: number = PLANS.free.dailyInteractions;

  if (isPremium) {
    remainingInteractions = Number.MAX_SAFE_INTEGER;
  } else {
    // Compter les sessions de chat créées aujourd'hui
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();

    const { count } = await supabase
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .gte('created_at', todayStart);

    const usedToday = count ?? 0;
    remainingInteractions = Math.max(0, (PLANS.free.dailyInteractions as number) - usedToday);
  }

  return NextResponse.json({
    isPremium,
    premiumExpiresAt: premiumExpiresAt?.toISOString() ?? null,
    remainingInteractions,
    dailyLimit: isPremium ? null : PLANS.free.dailyInteractions,
  });
}
