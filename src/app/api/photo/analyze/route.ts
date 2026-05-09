// src/app/api/photo/analyze/route.ts

/**
 * Analyse de photo de brouillon via Gemini Vision.
 *
 * Fonctionnalité pas encore implémentée — nécessite Gemini 2.5 Flash
 * avec input multimodal (image). Retourne une erreur explicite
 * plutôt qu'un placeholder silencieux.
 *
 * Quand ce sera implémenté :
 *   - Extraction texte + formules (KaTeX) depuis une photo
 *   - Traitement en mémoire (pas de persistance disque)
 *   - Validation type/taille image via Zod
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        "L'analyse de photo n'est pas encore disponible. Cette fonctionnalité arrive bientôt !",
      code: 'FEATURE_NOT_AVAILABLE',
    },
    { status: 501 }
  );
}
