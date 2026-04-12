// src/lib/ai/models.ts

/**
 * Noms des modèles Gemini utilisés dans toute l'application.
 *
 * Centralisés ici pour qu'un changement de version (deprecation, nouveau
 * modèle) soit fait à un seul endroit. Google Gemini change régulièrement
 * la liste des modèles disponibles et certaines versions sont retirées.
 *
 * Mise à jour pour Gemini 2.5 — les versions 1.5 sont retirées par Google.
 */

/** Modèle rapide — classification d'intentions, réponses motivantes, routing. */
export const GEMINI_FAST_MODEL = 'gemini-2.5-flash';

/** Modèle avancé — génération pédagogique, correction d'exercices (qualité). */
export const GEMINI_SMART_MODEL = 'gemini-2.5-pro';

/** Modèle d'embedding pour la recherche vectorielle pgvector (dimension 768). */
export const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';
