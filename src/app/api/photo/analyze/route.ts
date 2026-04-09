// src/app/api/photo/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter l'analyse de photo de brouillon via Gemini Vision
// - Vérifier l'authentification de l'élève
// - Extraire l'image du FormData (ne pas persister sur disque, traitement en mémoire)
// - Valider le type et la taille de l'image avec Zod
// - Envoyer l'image à Gemini Vision pour extraction du texte / formules
// - Retourner le contenu extrait (texte, formules KaTeX, annotations)

/**
 * Analyse photo brouillon via Gemini Vision
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    extractedText: "Placeholder extracted text",
    formulas: [],
    annotations: [],
  });
}
