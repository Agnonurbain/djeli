// src/lib/notifications/twilio.ts

/**
 * Client Twilio pour envoyer des SMS et des messages WhatsApp.
 *
 * Utilisé pour :
 * - Rapports hebdomadaires de progression envoyés aux parents sur WhatsApp
 * - Messages d'encouragement parent → élève (SMS de secours si offline)
 *
 * L'OTP de connexion passe PAR Supabase Auth (qui utilise Twilio Verify
 * côté serveur), pas par ce module. On garde donc ici uniquement les cas
 * "messagerie sortante" côté application.
 *
 * Variables d'environnement requises :
 *   - TWILIO_ACCOUNT_SID       : SID du compte (AC...)
 *   - TWILIO_AUTH_TOKEN        : jeton d'auth
 *   - TWILIO_WHATSAPP_NUMBER   : numéro WhatsApp émetteur (ex: "whatsapp:+14155238886" pour la sandbox)
 *   - TWILIO_PHONE_NUMBER      : (optionnel) numéro SMS émetteur
 *
 * En développement, si les variables sont absentes, les appels sont simulés
 * (log console). Cela évite d'avoir à configurer Twilio pour tester le flow
 * UI du dashboard parent.
 */

import twilio, { type Twilio } from 'twilio';

let cachedClient: Twilio | null = null;

/**
 * Instancie le client Twilio paresseusement. Retourne null si les credentials
 * ne sont pas configurés — on considère alors qu'on est en mode développement
 * et on simule les envois.
 */
function getClient(): Twilio | null {
  if (cachedClient) return cachedClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    return null;
  }

  cachedClient = twilio(sid, token);
  return cachedClient;
}

/**
 * Normalise un numéro ivoirien au format E.164 (+225XXXXXXXXXX).
 * Accepte les formats locaux (0XXXXXXXXX) et internationaux.
 */
function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225')) return `+${digits}`;
  // Préfixe CI 0 → 225
  if (digits.startsWith('0')) return `+225${digits.slice(1)}`;
  if (digits.length === 10) return `+225${digits}`;
  // Fallback : on ajoute juste +
  return `+${digits}`;
}

export interface SendResult {
  success: boolean;
  simulated?: boolean;
  sid?: string;
  error?: string;
}

/**
 * Envoie un message WhatsApp via Twilio.
 * Le numéro destinataire est automatiquement préfixé "whatsapp:".
 */
export async function sendWhatsApp(
  toPhone: string,
  message: string
): Promise<SendResult> {
  const fromRaw = process.env.TWILIO_WHATSAPP_NUMBER;
  const client = getClient();

  const toE164 = normalizePhoneE164(toPhone);
  const toWhatsapp = `whatsapp:${toE164}`;
  // L'env peut contenir soit "+14155238886" soit "whatsapp:+14155238886"
  const from = fromRaw?.startsWith('whatsapp:') ? fromRaw : `whatsapp:${fromRaw ?? ''}`;

  // Mode simulé — credentials absents ou from non configuré
  if (!client || !fromRaw) {
    console.log(
      `[twilio:whatsapp:simulated] to=${toWhatsapp} message="${message}"`
    );
    return { success: true, simulated: true };
  }

  try {
    const response = await client.messages.create({
      from,
      to: toWhatsapp,
      body: message,
    });
    return { success: true, sid: response.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[twilio:whatsapp] Erreur d\'envoi :', msg);
    return { success: false, error: msg };
  }
}

/**
 * Envoie un SMS simple via Twilio. Utilisé comme fallback quand WhatsApp
 * n'est pas disponible (ex : parent qui n'a pas de compte WhatsApp).
 */
export async function sendSms(
  toPhone: string,
  message: string
): Promise<SendResult> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  const client = getClient();

  const to = normalizePhoneE164(toPhone);

  if (!client || !from) {
    console.log(`[twilio:sms:simulated] to=${to} message="${message}"`);
    return { success: true, simulated: true };
  }

  try {
    const response = await client.messages.create({ from, to, body: message });
    return { success: true, sid: response.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[twilio:sms] Erreur d\'envoi :', msg);
    return { success: false, error: msg };
  }
}
