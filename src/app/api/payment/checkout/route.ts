// src/app/api/payment/checkout/route.ts

/**
 * Initiation d'un paiement Mobile Money via CinetPay.
 *
 * POST { planId: "premium", paymentMethod?: "orange_money" }
 *
 * 1. Auth Supabase
 * 2. Validation Zod
 * 3. Création d'une transaction en DB (statut pending)
 * 4. Appel CinetPay initPayment (simulé si CINETPAY_API_KEY absent)
 * 5. Retour de l'URL de paiement au client
 *
 * Le client redirige l'utilisateur vers cette URL. Après paiement,
 * CinetPay envoie un webhook à /api/payment/webhook, qui met à jour
 * la transaction et active le premium.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkoutSchema } from '@/lib/utils/validators';
import { PLANS } from '@/lib/payment/plans';
import { initPayment, IS_TEST_MODE } from '@/lib/payment/cinetpay';

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

  const parseResult = checkoutSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? 'Données invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { planId } = parseResult.data;
  const plan = PLANS[planId];

  if (planId === 'free' || plan.priceXOF === 0) {
    return NextResponse.json(
      { error: 'Le plan gratuit ne nécessite pas de paiement.', code: 'FREE_PLAN' },
      { status: 400 }
    );
  }

  // Récupérer le numéro de téléphone de l'utilisateur
  const { data: userRow } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user.id)
    .single();

  if (!userRow?.phone) {
    return NextResponse.json(
      { error: 'Numéro de téléphone introuvable.', code: 'PHONE_MISSING' },
      { status: 404 }
    );
  }

  // Créer la transaction en DB
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: plan.priceXOF,
      currency: 'XOF',
      status: 'pending',
      payment_method: parseResult.data.paymentMethod ?? null,
    })
    .select('id')
    .single();

  if (txError || !tx) {
    console.error('[checkout] create transaction failed:', txError);
    return NextResponse.json(
      { error: 'Impossible de créer la transaction.', code: 'TX_CREATE_FAILED' },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;

  try {
    const cinetpayResponse = await initPayment({
      amount: plan.priceXOF,
      transactionId: tx.id,
      description: `Djeli ${plan.name} — 1 mois`,
      customerPhone: userRow.phone,
      returnUrl: `${origin}/abonnement/retour`,
      notifyUrl: `${origin}/api/payment/webhook`,
    });

    // Stocker le token CinetPay pour référence
    await supabase
      .from('transactions')
      .update({ cinetpay_transaction_id: cinetpayResponse.data.payment_token })
      .eq('id', tx.id);

    return NextResponse.json({
      paymentUrl: cinetpayResponse.data.payment_url,
      transactionId: tx.id,
      testMode: IS_TEST_MODE,
    });
  } catch (err) {
    console.error('[checkout] initPayment failed:', err);
    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('id', tx.id);

    return NextResponse.json(
      {
        error: 'Impossible d\'initier le paiement.',
        code: 'CINETPAY_INIT_FAILED',
      },
      { status: 502 }
    );
  }
}
