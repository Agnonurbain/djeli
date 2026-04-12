// src/lib/ai/nodes/router.ts

/**
 * Noeud de routage — classifie l'intention de l'élève.
 *
 * Intentions possibles :
 * - "teach"    : l'élève demande une explication, un cours
 * - "evaluate" : l'élève soumet un exercice, demande une correction
 * - "motivate" : l'élève exprime du découragement, de la frustration
 *
 * Utilise Gemini Flash (rapide) pour classifier l'intention à partir
 * du message et de l'historique de conversation récent.
 */

import type { Intent, EmotionalState, Message } from '@/types/chat';
import { getGeminiModel, type DjeliState } from '@/lib/ai/agent';
import { GEMINI_FAST_MODEL } from '@/lib/ai/models';

/** Nombre de messages récents à inclure dans le contexte de classification */
const RECENT_HISTORY_COUNT = 6;

/** Intentions valides que le routeur peut retourner */
const VALID_INTENTS: readonly Intent[] = ['teach', 'evaluate', 'motivate'] as const;

/** États émotionnels valides */
const VALID_EMOTIONAL_STATES: readonly EmotionalState[] = [
  'neutre',
  'motive',
  'decourage',
  'frustre',
  'ennuye',
] as const;

/**
 * Formate les messages récents en texte pour le prompt de classification.
 */
function formatRecentHistory(messages: Message[], count: number): string {
  const recent = messages.slice(-count);
  return recent
    .map((msg) => `[${msg.role}]: ${msg.content}`)
    .join('\n');
}

/**
 * Prompt de classification envoyé à Gemini Flash.
 * Doit retourner un JSON strict avec intent et emotionalState.
 */
function buildClassificationPrompt(
  lastMessage: string,
  recentHistory: string
): string {
  return `Tu es un système de classification pour un tuteur IA ivoirien.
Analyse le dernier message de l'élève et l'historique récent pour déterminer :
1. L'intention principale (intent)
2. L'état émotionnel de l'élève (emotionalState)

## Intentions possibles
- "teach" : l'élève pose une question, demande une explication, veut comprendre un concept, demande un cours
- "evaluate" : l'élève soumet une réponse à un exercice, demande une correction, envoie un calcul ou un QCM
- "motivate" : l'élève exprime du découragement, de la frustration, dit qu'il n'y arrive pas, veut abandonner

## États émotionnels possibles
- "neutre" : pas d'émotion particulière détectée
- "motive" : l'élève est enthousiaste, curieux, engagé
- "decourage" : l'élève se sent dépassé, dit qu'il ne comprend pas, veut abandonner
- "frustre" : l'élève est agacé, trouve que c'est trop difficile ou injuste
- "ennuye" : l'élève montre de l'ennui, manque d'intérêt

## Historique récent
${recentHistory || '(pas d\'historique)'}

## Dernier message de l'élève
${lastMessage}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :
{"intent": "teach|evaluate|motivate", "emotionalState": "neutre|motive|decourage|frustre|ennuye"}`;
}

/**
 * Parse la réponse JSON de Gemini et valide les champs.
 */
function parseClassificationResponse(responseText: string): {
  intent: Intent;
  emotionalState: EmotionalState;
} {
  // Nettoyer la réponse (enlever les éventuels backticks markdown)
  const cleaned = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'intent' in parsed &&
      'emotionalState' in parsed
    ) {
      const obj = parsed as { intent: string; emotionalState: string };

      const intent = VALID_INTENTS.includes(obj.intent as Intent)
        ? (obj.intent as Intent)
        : 'teach';

      const emotionalState = VALID_EMOTIONAL_STATES.includes(
        obj.emotionalState as EmotionalState
      )
        ? (obj.emotionalState as EmotionalState)
        : 'neutre';

      return { intent, emotionalState };
    }
  } catch {
    // En cas d'échec de parsing, on continue avec les valeurs par défaut
  }

  // Valeurs par défaut si le parsing échoue
  return { intent: 'teach', emotionalState: 'neutre' };
}

/**
 * Classifie l'intention de l'élève et détecte son état émotionnel.
 * Utilise Gemini Flash pour la rapidité (la classification est une tâche simple).
 */
export async function routerNode(
  state: DjeliState
): Promise<Partial<DjeliState>> {
  const model = getGeminiModel(GEMINI_FAST_MODEL);

  // Si l'API n'est pas configurée, on route par défaut vers teach
  if (!model) {
    return {
      intent: 'teach',
      emotionalState: 'neutre',
    };
  }

  const recentHistory = formatRecentHistory(
    state.messages,
    RECENT_HISTORY_COUNT
  );

  const prompt = buildClassificationPrompt(
    state.lastUserMessage,
    recentHistory
  );

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const { intent, emotionalState } = parseClassificationResponse(responseText);

    return { intent, emotionalState };
  } catch (error) {
    // En cas d'erreur réseau ou API, on route vers teach par défaut
    console.error(
      '[Router] Erreur lors de la classification :',
      error instanceof Error ? error.message : error
    );
    return {
      intent: 'teach',
      emotionalState: 'neutre',
    };
  }
}
