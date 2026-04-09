// src/components/chibi/chibi-emotions.ts

/**
 * États émotionnels possibles de l'avatar Prof Chibi.
 * Chaque émotion correspond à une animation Rive spécifique.
 */
export const CHIBI_EMOTIONS = {
  happy: "happy",
  thinking: "thinking",
  sad: "sad",
  excited: "excited",
} as const;

export type ChibiEmotion = keyof typeof CHIBI_EMOTIONS;
