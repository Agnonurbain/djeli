// src/app/api/parent/boost/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter l'envoi d'encouragement parent → élève
// - Vérifier l'authentification du parent
// - Valider le message d'encouragement et l'ID élève avec Zod
// - Vérifier la relation parent-élève dans la table de liaison
// - Sauvegarder le message d'encouragement dans Supabase
// - Envoyer une notification en temps réel à l'élève via Supabase Realtime
// - Optionnel : envoyer un SMS si l'élève est hors ligne

/**
 * Envoi encouragement parent → élève
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
