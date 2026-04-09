// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter le CRUD progression / arbre de maîtrise
// GET : Récupérer la progression de l'élève (arbre de compétences, scores, historique)
// POST : Mettre à jour la progression après un exercice ou une évaluation
// - Vérifier l'authentification de l'élève
// - Valider les paramètres avec Zod
// - Calculer le nouveau score de maîtrise pour chaque compétence
// - Mettre à jour l'arbre de maîtrise dans Supabase

/**
 * CRUD progression / arbre de maîtrise
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    studentId: "placeholder-id",
    masteryTree: [],
    overallProgress: 0,
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
