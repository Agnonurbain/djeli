// src/app/api/auth/pair-parent/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter l'appairage parent-élève via code
// - Vérifier l'authentification du parent
// - Valider le code d'appairage avec Zod
// - Vérifier que le code correspond à un élève existant
// - Créer la relation parent-élève dans la table de liaison
// - Notifier l'élève de l'appairage via Realtime

/**
 * Appairage parent-élève via code
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
