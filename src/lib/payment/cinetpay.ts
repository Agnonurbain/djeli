// src/lib/payment/cinetpay.ts

/**
 * Intégration CinetPay : init, verify, webhook handler.
 *
 * CinetPay est l'agrégateur Mobile Money utilisé en Côte d'Ivoire.
 * Supporte : Orange Money, MTN MoMo, Wave.
 *
 * Flux :
 *   1. Initialiser un paiement → obtenir une URL de redirection
 *   2. L'utilisateur complète le paiement via USSD sur son téléphone
 *   3. CinetPay envoie un webhook POST /api/payment/webhook
 *   4. Vérification de la signature + mise à jour is_premium en DB
 */

export interface CinetPayInitParams {
  /** Montant en FCFA */
  amount: number;
  /** Identifiant unique de la transaction côté Djeli */
  transactionId: string;
  /** Description affichée à l'utilisateur */
  description: string;
  /** Numéro de téléphone de l'utilisateur (format CI) */
  customerPhone: string;
  /** URL de retour après paiement */
  returnUrl: string;
  /** URL de notification webhook */
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

/**
 * Initialise un paiement CinetPay.
 * Retourne l'URL de redirection vers la page de paiement.
 */
export async function initPayment(
  _params: CinetPayInitParams
): Promise<CinetPayResponse> {
  // TODO: Appeler l'API CinetPay pour initialiser le paiement
  // POST https://api-checkout.cinetpay.com/v2/payment
  // Headers: Content-Type application/json
  // Body: { apikey, site_id, transaction_id, amount, currency: 'XOF', description, ... }
  throw new Error('CinetPay initPayment non implémenté');
}

/**
 * Vérifie le statut d'une transaction CinetPay.
 */
export async function verifyTransaction(
  _transactionId: string
): Promise<{ status: 'pending' | 'completed' | 'failed'; paymentMethod: string }> {
  // TODO: Appeler l'API CinetPay pour vérifier le statut
  // POST https://api-checkout.cinetpay.com/v2/payment/check
  throw new Error('CinetPay verifyTransaction non implémenté');
}

/**
 * Valide la signature d'un webhook CinetPay.
 * Protège contre les faux callbacks.
 */
export function verifyWebhookSignature(_payload: CinetPayWebhookPayload): boolean {
  // TODO: Vérifier la signature HMAC avec CINETPAY_SECRET_KEY
  // Comparer le hash calculé avec payload.signature
  throw new Error('CinetPay verifyWebhookSignature non implémenté');
}
