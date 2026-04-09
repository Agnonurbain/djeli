// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter l'envoi OTP via Twilio Verify
// - Valider le numéro de téléphone (format CI : +225XXXXXXXXXX) avec Zod
// - Vérifier le rate limiting (max 3 OTP par numéro par heure)
// - Appeler Twilio Verify API pour envoyer le code SMS
// - Retourner le statut d'envoi

/**
 * Envoi OTP via Twilio Verify
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
