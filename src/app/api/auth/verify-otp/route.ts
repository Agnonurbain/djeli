// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter la vérification OTP et création de session
// - Valider le numéro de téléphone et le code OTP avec Zod
// - Appeler Twilio Verify API pour vérifier le code
// - Créer ou récupérer l'utilisateur dans Supabase Auth
// - Créer une session avec cookie httpOnly
// - Retourner les infos utilisateur et le token de session

/**
 * Vérification OTP et création session
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
