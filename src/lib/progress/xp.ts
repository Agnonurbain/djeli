// src/lib/progress/xp.ts

/**
 * Module XP + progression de maîtrise.
 *
 * Source unique de vérité pour le barème de points, les paliers de niveau,
 * et la logique de progression de maîtrise (novice → maitre).
 *
 * Principe : chaque exercice validé rapporte des XP proportionnels à la
 * difficulté du type et à la qualité de la réponse (score 0..1).
 * Les niveaux suivent une progression quadratique douce pour que les premiers
 * niveaux s'enchaînent vite (effet "rampe de lancement") mais que la
 * progression ralentisse naturellement aux niveaux élevés.
 */

import type { ExerciseType, MasteryLevel } from '@/types/curriculum';
import type { Mastery } from '@/types/chat';

/**
 * Barème XP par type d'exercice à score parfait (1.0).
 * Le score réel (0..1) est ensuite multiplié à ce montant de base.
 *
 * - QCM : facile à corriger automatiquement, récompense modérée
 * - Calcul : demande une démarche claire, récompense un peu plus élevée
 * - Rédaction : demande de la structure, récompense élevée
 * - Photo : brouillon manuscrit analysé, récompense maximale
 */
export const XP_REWARDS: Record<ExerciseType, number> = {
  qcm: 10,
  calcul: 15,
  redaction: 25,
  photo: 30,
} as const;

/**
 * Score minimal (0..1) à partir duquel un exercice compte comme "validé"
 * et fait progresser la maîtrise. Sous ce seuil, on attribue quand même
 * quelques XP "de participation" mais la maîtrise n'avance pas.
 */
export const MASTERY_PASS_THRESHOLD = 0.5;

/**
 * Fraction de l'XP attribuée quand le score est sous le seuil de validation.
 * Permet d'encourager l'effort sans récompenser l'échec comme une réussite.
 */
export const PARTICIPATION_XP_RATIO = 0.3;

/**
 * Paliers de maîtrise, dans l'ordre croissant.
 * Un élève qui valide suffisamment d'exercices avec un bon score monte au palier suivant.
 */
export const MASTERY_LADDER: readonly Mastery[] = [
  'novice',
  'apprenti',
  'confirme',
  'expert',
  'maitre',
] as const;

/**
 * Nombre d'exercices validés nécessaires pour atteindre chaque palier.
 * Ex : 3 validations pour passer novice → apprenti, 6 total pour confirmé, etc.
 * Le score moyen doit aussi être ≥ MASTERY_PASS_THRESHOLD.
 */
export const MASTERY_THRESHOLDS: Record<Mastery, number> = {
  novice: 0,
  apprenti: 3,
  confirme: 7,
  expert: 15,
  maitre: 25,
} as const;

/**
 * XP nécessaire pour atteindre un niveau donné (niveau 1 = 0 XP).
 *
 * Formule quadratique douce : niveau N nécessite 50 * (N-1)^2 XP cumulés.
 * Niveau 1 : 0 / Niveau 2 : 50 / Niveau 3 : 200 / Niveau 4 : 450 / ...
 *
 * Cette courbe donne un sentiment de progression rapide au début puis
 * ralentit — ce qui colle à l'expérience jeu vidéo que les élèves connaissent.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * (level - 1);
}

/**
 * Calcule le niveau actuel d'un élève à partir de ses XP cumulés.
 * Retourne le plus grand niveau N tel que xpForLevel(N) <= xp.
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  // Résolution : N = 1 + sqrt(xp / 50)
  const level = 1 + Math.floor(Math.sqrt(xp / 50));
  return Math.max(1, level);
}

/**
 * Informations de progression au niveau de l'élève, dérivées de l'XP total.
 * Utilisées pour afficher la barre XP (progression vers le prochain niveau).
 */
export interface LevelProgress {
  /** Niveau actuel (entier ≥ 1) */
  currentLevel: number;
  /** XP cumulé total de l'élève */
  totalXp: number;
  /** XP cumulé nécessaire pour avoir atteint le niveau courant */
  xpAtCurrentLevel: number;
  /** XP cumulé nécessaire pour atteindre le niveau suivant */
  xpForNextLevel: number;
  /** XP engrangé dans le niveau courant (0..xpInCurrentLevel) */
  xpInCurrentLevel: number;
  /** Taille totale du niveau courant en XP (xpForNextLevel - xpAtCurrentLevel) */
  xpSpanCurrentLevel: number;
}

/**
 * Dérive les informations de progression à partir de l'XP total.
 */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const currentLevel = calculateLevel(safeXp);
  const xpAtCurrentLevel = xpForLevel(currentLevel);
  const xpForNextLevel = xpForLevel(currentLevel + 1);

  return {
    currentLevel,
    totalXp: safeXp,
    xpAtCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel: safeXp - xpAtCurrentLevel,
    xpSpanCurrentLevel: xpForNextLevel - xpAtCurrentLevel,
  };
}

/**
 * Calcule les XP à attribuer pour un exercice donné.
 *
 * @param type Type d'exercice (détermine la base XP)
 * @param score Score obtenu (0..1)
 * @returns XP entier à ajouter (≥ 0)
 */
export function xpRewardForExercise(type: ExerciseType, score: number): number {
  const clamped = Math.min(1, Math.max(0, score));
  const base = XP_REWARDS[type];

  // Sous le seuil de validation : XP de participation réduite
  if (clamped < MASTERY_PASS_THRESHOLD) {
    return Math.round(base * PARTICIPATION_XP_RATIO * clamped);
  }

  return Math.round(base * clamped);
}

/**
 * Détermine le nouveau niveau de maîtrise d'un topic après un exercice validé.
 *
 * Règle : on monte d'un palier dès que le nombre d'exercices validés atteint
 * le seuil du palier suivant ET que le dernier score est ≥ MASTERY_PASS_THRESHOLD.
 *
 * @param currentLevel Niveau de maîtrise actuel sur ce topic
 * @param nextExercisesCompleted Nombre d'exercices validés après celui qu'on vient de faire
 * @param lastScore Score du dernier exercice (0..1)
 */
export function nextMasteryLevel(
  currentLevel: Mastery,
  nextExercisesCompleted: number,
  lastScore: number
): Mastery {
  // Si le score est sous le seuil de validation, la maîtrise ne recule pas
  // mais ne progresse pas non plus — on reste au palier actuel.
  if (lastScore < MASTERY_PASS_THRESHOLD) {
    return currentLevel;
  }

  // Chercher le palier le plus élevé atteignable avec ce nombre d'exercices
  let reached: Mastery = 'novice';
  for (const level of MASTERY_LADDER) {
    if (nextExercisesCompleted >= MASTERY_THRESHOLDS[level]) {
      reached = level;
    }
  }

  // On ne rétrograde jamais : on prend le max entre l'actuel et le calculé
  const currentIndex = MASTERY_LADDER.indexOf(currentLevel);
  const reachedIndex = MASTERY_LADDER.indexOf(reached);
  return MASTERY_LADDER[Math.max(currentIndex, reachedIndex)];
}

/**
 * Pourcentage de progression d'un palier de maîtrise (0..100),
 * utile pour afficher une barre de progression par topic.
 */
export function masteryPercent(level: Mastery): number {
  const index = MASTERY_LADDER.indexOf(level);
  if (index < 0) return 0;
  // novice = 0, apprenti = 25, confirmé = 50, expert = 75, maitre = 100
  return Math.round((index / (MASTERY_LADDER.length - 1)) * 100);
}

/**
 * Libellés français pour l'affichage.
 */
export const MASTERY_LABELS: Record<Mastery, string> = {
  novice: 'Novice',
  apprenti: 'Apprenti',
  confirme: 'Confirmé',
  expert: 'Expert',
  maitre: 'Maître',
} as const;

/**
 * Re-export pour faciliter l'usage côté UI quand on travaille avec
 * le type `MasteryLevel` (noeud de l'arbre) plutôt que le palier seul.
 */
export type { MasteryLevel };
