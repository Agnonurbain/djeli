// src/app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter le callback webhook CinetPay
// - Vérifier la signature du webhook CinetPay (anti-fraude)
// - Valider le payload avec Zod
// - Récupérer la transaction correspondante dans Supabase
// - Mettre à jour le statut de la transaction (success / failed)
// - Si succès : activer l'abonnement de l'utilisateur
// - Envoyer une confirmation SMS via Twilio

/**
 * Callback webhook CinetPay — vérification signature
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
