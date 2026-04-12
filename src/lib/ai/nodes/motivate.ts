// src/lib/ai/nodes/motivate.ts

/**
 * Noeud détection découragement et motivation.
 *
 * Ce noeud est déclenché quand le routeur détecte :
 *   - "motivate" comme intention
 *   - OU un état émotionnel "decourage" / "frustre" / "ennuye"
 *
 * Il génère une réponse empathique, encourageante, adaptée au niveau de l'élève
 * et à son état émotionnel. Gemini 1.5 Flash est utilisé ici : la tâche est
 * plus conversationnelle et moins exigeante qu'une explication pédagogique.
 */

import { buildSystemPrompt } from '@/lib/ai/prompts/system';
import { getGeminiModel, type DjeliState } from '@/lib/ai/agent';
import type { EmotionalState, Message } from '@/types/chat';
import type { StudentLevel } from '@/types/curriculum';

/** Nombre de messages récents à inclure pour contextualiser la motivation */
const RECENT_HISTORY_COUNT = 4;

/**
 * Formate les messages récents pour donner du contexte au prompt de motivation.
 */
function formatRecentHistory(messages: Message[], count: number): string {
  return messages
    .slice(-count)
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => `[${msg.role}]: ${msg.content}`)
    .join('\n');
}

/**
 * Consignes spécifiques selon l'état émotionnel détecté.
 */
function buildEmotionalGuidance(emotionalState: EmotionalState): string {
  switch (emotionalState) {
    case 'decourage':
      return (
        "L'élève est découragé. Ta priorité : lui redonner confiance. " +
        "Rappelle-lui ses progrès, valorise ses efforts, propose une étape plus petite " +
        "et réalisable. Utilise un ton chaleureux, comme un grand frère bienveillant."
      );
    case 'frustre':
      return (
        "L'élève est frustré. Prends du recul avec lui, valide son émotion " +
        "(\"C'est normal de trouver ça difficile\"), puis propose une approche différente. " +
        "Suggère une pause si c'est pertinent."
      );
    case 'ennuye':
      return (
        "L'élève s'ennuie. Ravive sa curiosité avec un défi stimulant, " +
        "une anecdote surprenante, ou un lien avec ses centres d'intérêt (foot, musique, " +
        "jeux vidéo, quotidien à Abidjan)."
      );
    case 'motive':
      return (
        "L'élève est motivé ! Profite de cette énergie pour l'inviter à aller " +
        "plus loin, lui proposer un défi ambitieux ou une question ouverte."
      );
    default:
      return (
        "Sois empathique et encourageant. Demande-lui ce qui le bloque " +
        "et propose ton aide de manière concrète."
      );
  }
}

/**
 * Génère une réponse motivante adaptée à l'état émotionnel de l'élève.
 */
export async function motivateNode(
  state: DjeliState
): Promise<Partial<DjeliState>> {
  const model = getGeminiModel('gemini-1.5-flash');

  if (!model) {
    return {
      response:
        "Courage ! Tu peux le faire. Essaie de reformuler ta question ou " +
        "dis-moi ce qui te bloque, on va y arriver ensemble.",
    };
  }

  const systemPromptBase = buildSystemPrompt({
    level: state.level as StudentLevel,
    subject: state.subject,
    emotionalState: state.emotionalState,
    mastery: state.mastery,
  });

  const emotionalGuidance = buildEmotionalGuidance(state.emotionalState);
  const recentHistory = formatRecentHistory(
    state.messages,
    RECENT_HISTORY_COUNT
  );

  const userPrompt = `## Directive pour cette réponse
${emotionalGuidance}

## Historique récent
${recentHistory || '(première interaction)'}

## Dernier message de l'élève
${state.lastUserMessage}

Réponds directement à l'élève (pas de préambule méta), avec un ton adapté à son niveau
et à son état émotionnel. Reste bref : 2 à 4 phrases, éventuellement une question
pour relancer la conversation.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: systemPromptBase,
    });

    return {
      response: result.response.text(),
    };
  } catch (error) {
    console.error(
      '[Motivate] Erreur Gemini :',
      error instanceof Error ? error.message : error
    );
    return {
      response:
        "Je suis là pour t'aider. Dis-moi ce qui te bloque et on va progresser ensemble.",
    };
  }
}
