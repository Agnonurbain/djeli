// src/app/api/parent/report/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter la génération de rapport hebdomadaire parent
// - Vérifier l'authentification du parent
// - Valider les paramètres (élève, période) avec Zod
// - Récupérer la progression de l'élève sur la semaine
// - Agréger les métriques : temps d'étude, exercices complétés, score moyen
// - Générer un résumé en français via Gemini
// - Retourner le rapport structuré

/**
 * Génération rapport hebdomadaire parent
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    studentName: "Placeholder",
    period: "2026-W15",
    studyTimeMinutes: 0,
    exercisesCompleted: 0,
    averageScore: 0,
    summary: "Placeholder rapport hebdomadaire",
  });
}
