// src/app/api/payment/webhook/route.ts

/**
 * Webhook CinetPay — appelé par CinetPay après un paiement.
 *
 * En mode test (CINETPAY_API_KEY absent), le webhook peut être simulé
 * manuellement en POST avec le body :
 *   { cpm_trans_id: "<uuid>", cpm_trans_status: "ACCEPTED", ... }
 *
 * Flow :
 *   1. Parse le body
 *   2. Vérifier la signature HMAC (skip en test mode)
 *   3. Vérifier la transaction côté CinetPay (double check)
 *   4. Mettre à jour la transaction en DB
 *   5. Si status = completed → activer premium pour l'utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyWebhookSignature,
  verifyTransaction,
  IS_TEST_MODE,
  type CinetPayWebhookPayload,
} from '@/lib/payment/cinetpay';

const PREMIUM_DURATION_DAYS = 30;

export async function POST(request: NextRequest) {
  let payload: CinetPayWebhookPayload;
  try {
    payload = (await request.json()) as CinetPayWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: 'Payload invalide.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const transactionId = payload.cpm_trans_id;
  if (!transactionId) {
    return NextResponse.json(
      { error: 'cpm_trans_id manquant.', code: 'MISSING_TRANS_ID' },
      { status: 400 }
    );
  }

  // Vérification signature (bypass en test mode)
  if (!verifyWebhookSignature(payload)) {
    console.error('[webhook] Signature invalide pour', transactionId);
    return NextResponse.json(
      { error: 'Signature invalide.', code: 'INVALID_SIGNATURE' },
      { status: 403 }
    );
  }

  // Double-vérification auprès de CinetPay (ou simulation)
  const verification = await verifyTransaction(transactionId);

  const supabase = await createClient();

  // Retrouver la transaction en DB
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('id, user_id, status')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !tx) {
    console.error('[webhook] Transaction introuvable:', transactionId);
    return NextResponse.json(
      { error: 'Transaction introuvable.', code: 'TX_NOT_FOUND' },
      { status: 404 }
    );
  }

  // Ignorer si déjà traitée (idempotence)
  if (tx.status === 'completed') {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Mettre à jour la transaction
  const newStatus = verification.status;
  await supabase
    .from('transactions')
    .update({
      status: newStatus,
      payment_method: verification.paymentMethod || payload.cpm_payment_method || null,
    })
    .eq('id', tx.id);

  // Si le paiement est confirmé → activer le premium
  if (newStatus === 'completed' && tx.user_id) {
    const premiumExpiresAt = new Date(
      Date.now() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: upgradeError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: premiumExpiresAt,
      })
      .eq('id', tx.user_id);

    if (upgradeError) {
      console.error('[webhook] Upgrade premium failed:', upgradeError);
    } else {
      console.log(
        `[webhook] ✓ Premium activé pour ${tx.user_id} jusqu'au ${premiumExpiresAt}`,
        IS_TEST_MODE ? '(test mode)' : ''
      );
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
