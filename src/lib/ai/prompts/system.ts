// src/lib/ai/prompts/system.ts

/**
 * Construction dynamique du system prompt selon le profil de l'élève.
 *
 * Le prompt est adapté selon :
 * - Le niveau (6ème→M2) : ton ludique, structuré ou expert
 * - La matière en cours
 * - L'état émotionnel détecté : plus d'encouragements si découragement
 * - La progression dans le topic : plus d'exemples si novice, plus de défis si expert
 */

import type { StudentLevel } from '@/types/curriculum';
import type { Mastery } from '@/types/chat';
import { COLLEGE_PROMPT } from '@/lib/ai/prompts/college';
import { LYCEE_PROMPT } from '@/lib/ai/prompts/lycee';
import { UNIVERSITE_PROMPT } from '@/lib/ai/prompts/universite';

/** Niveaux collège */
const COLLEGE_LEVELS: StudentLevel[] = ['6eme', '5eme', '4eme', '3eme'];

/** Niveaux lycée */
const LYCEE_LEVELS: StudentLevel[] = ['2nde', '1ere', 'tle'];

/** Niveaux université */
const UNIVERSITE_LEVELS: StudentLevel[] = ['l1', 'l2', 'l3', 'm1', 'm2'];

export type EmotionalState = 'neutre' | 'motive' | 'decourage' | 'frustre' | 'ennuye';

interface SystemPromptParams {
  level: StudentLevel;
  subject: string;
  emotionalState: EmotionalState;
  mastery: Mastery;
}

/**
 * Construit le system prompt dynamique pour Gemini.
 */
export function buildSystemPrompt({
  level,
  subject,
  emotionalState,
  mastery,
}: SystemPromptParams): string {
  // Sélection du prompt de base selon le cycle
  let basePrompt: string;
  if (COLLEGE_LEVELS.includes(level)) {
    basePrompt = COLLEGE_PROMPT;
  } else if (LYCEE_LEVELS.includes(level)) {
    basePrompt = LYCEE_PROMPT;
  } else if (UNIVERSITE_LEVELS.includes(level)) {
    basePrompt = UNIVERSITE_PROMPT;
  } else {
    basePrompt = LYCEE_PROMPT;
  }

  // Adaptation selon l'état émotionnel
  let emotionalDirective = '';
  switch (emotionalState) {
    case 'decourage':
      emotionalDirective =
        "L'élève semble découragé. Sois particulièrement encourageant, valorise les efforts, " +
        'propose des étapes plus petites. Utilise des phrases comme "Tu progresses bien !" ou ' +
        '"C\'est normal de trouver ça difficile, on va y arriver ensemble."';
      break;
    case 'frustre':
      emotionalDirective =
        "L'élève semble frustré. Reformule tes explications différemment, utilise des analogies " +
        'concrètes du quotidien ivoirien. Propose une approche alternative.';
      break;
    case 'ennuye':
      emotionalDirective =
        "L'élève semble s'ennuyer. Rends le contenu plus dynamique, pose des questions " +
        'stimulantes, propose un défi ou un problème concret et intéressant.';
      break;
    case 'motive':
      emotionalDirective =
        "L'élève est motivé ! Profite de cette énergie pour approfondir le sujet et " +
        'proposer des défis plus ambitieux.';
      break;
    default:
      emotionalDirective = '';
  }

  // Adaptation selon le niveau de maîtrise du topic
  let masteryDirective = '';
  switch (mastery) {
    case 'novice':
      masteryDirective =
        "L'élève débute sur ce sujet. Donne beaucoup d'exemples concrets, " +
        "avance pas à pas, vérifie la compréhension à chaque étape.";
      break;
    case 'apprenti':
      masteryDirective =
        "L'élève a les bases. Commence à introduire des cas plus complexes " +
        "tout en consolidant les fondamentaux.";
      break;
    case 'confirme':
      masteryDirective =
        "L'élève maîtrise les bases. Propose des exercices d'application variés " +
        "et commence à faire des liens entre les concepts.";
      break;
    case 'expert':
      masteryDirective =
        "L'élève a un bon niveau. Propose des problèmes ouverts, des exercices " +
        "de synthèse et des applications avancées.";
      break;
    case 'maitre':
      masteryDirective =
        "L'élève maîtrise parfaitement ce sujet. Propose des défis d'excellence, " +
        "des problèmes de concours, ou aide-le à enseigner le concept à d'autres.";
      break;
  }

  return [
    basePrompt,
    '',
    `## Contexte actuel`,
    `- **Matière** : ${subject}`,
    `- **Niveau** : ${level}`,
    `- **Maîtrise du sujet** : ${mastery}`,
    '',
    emotionalDirective ? `## Directive émotionnelle\n${emotionalDirective}` : '',
    masteryDirective ? `## Directive pédagogique\n${masteryDirective}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
