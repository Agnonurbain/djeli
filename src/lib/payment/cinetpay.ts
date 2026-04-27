// src/lib/payment/cinetpay.ts

/**
 * Intégration CinetPay : init, verify, webhook handler.
 *
 * CinetPay est l'agrégateur Mobile Money utilisé en Côte d'Ivoire.
 * Supporte : Orange Money, MTN MoMo, Wave.
 *
 * Mode test :
 *   Si CINETPAY_API_KEY est absente, toutes les opérations sont simulées :
 *   - initPayment retourne une URL fictive /api/payment/test-return
 *   - verifyTransaction retourne "completed" immédiatement
 *   - verifyWebhookSignature retourne true
 *   Cela permet de tester le flow complet (DB, upgrade premium) sans
 *   avoir un vrai compte CinetPay.
 *
 * Variables d'environnement (mode production) :
 *   - CINETPAY_API_KEY    : clé API (Dashboard CinetPay)
 *   - CINETPAY_SITE_ID    : identifiant du site
 *   - CINETPAY_SECRET_KEY : clé secrète pour vérification des webhooks
 */

import crypto from 'crypto';

const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY ?? '';
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID ?? '';
const CINETPAY_SECRET_KEY = process.env.CINETPAY_SECRET_KEY ?? '';

export const IS_TEST_MODE = !CINETPAY_API_KEY;

export interface CinetPayInitParams {
  amount: number;
  transactionId: string;
  description: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface CinetPayResponse {
  code: string;
  message: string;
  data: {
    payment_url: string;
    payment_token: string;
  };
}

export interface CinetPayWebhookPayload {
  cpm_trans_id: string;
  cpm_site_id: string;
  cpm_amount: string;
  cpm_currency: string;
  cpm_payment_method: string;
  cpm_phone_prefixe: string;
  cpm_trans_status: string;
  cpm_trans_date: string;
  signature: string;
}

export async function initPayment(
  params: CinetPayInitParams
): Promise<CinetPayResponse> {
  if (IS_TEST_MODE) {
    console.log('[cinetpay:test] initPayment simulé', {
      transactionId: params.transactionId,
      amount: params.amount,
    });
    return {
      code: '201',
      message: 'CREATED (test mode)',
      data: {
        payment_url: `${params.returnUrl}?transaction_id=${params.transactionId}&status=ACCEPTED`,
        payment_token: `test-token-${params.transactionId}`,
      },
    };
  }

  const response = await fetch(
    'https://api-checkout.cinetpay.com/v2/payment',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: params.transactionId,
        amount: params.amount,
        currency: 'XOF',
        description: params.description,
        customer_phone_number: params.customerPhone,
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
        channels: 'MOBILE_MONEY',
        lang: 'FR',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`CinetPay API error: ${response.status}`);
  }

  return (await response.json()) as CinetPayResponse;
}

export async function verifyTransaction(
  transactionId: string
): Promise<{ status: 'pending' | 'completed' | 'failed'; paymentMethod: string }> {
  if (IS_TEST_MODE) {
    console.log('[cinetpay:test] verifyTransaction simulé', { transactionId });
    return { status: 'completed', paymentMethod: 'test_mobile_money' };
  }

  const response = await fetch(
    'https://api-checkout.cinetpay.com/v2/payment/check',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`CinetPay verify error: ${response.status}`);
  }

  const result = await response.json();
  const cpStatus = result?.data?.status;

  if (cpStatus === 'ACCEPTED') {
    return {
      status: 'completed',
      paymentMethod: result?.data?.payment_method ?? 'mobile_money',
    };
  }

  if (cpStatus === 'REFUSED' || cpStatus === 'ERROR') {
    return { status: 'failed', paymentMethod: '' };
  }

  return { status: 'pending', paymentMethod: '' };
}

export function verifyWebhookSignature(payload: CinetPayWebhookPayload): boolean {
  if (IS_TEST_MODE) return true;

  if (!CINETPAY_SECRET_KEY) {
    console.error('[cinetpay] CINETPAY_SECRET_KEY non configurée');
    return false;
  }

  const toSign = `${payload.cpm_site_id}${payload.cpm_trans_id}${payload.cpm_trans_date}${payload.cpm_amount}`;
  const expected = crypto
    .createHmac('sha256', CINETPAY_SECRET_KEY)
    .update(toSign)
    .digest('hex');

  return expected === payload.signature;
}
