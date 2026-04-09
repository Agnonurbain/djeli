// src/lib/ai/nodes/router.ts

/**
 * Noeud de routage — classifie l'intention de l'élève.
 *
 * Intentions possibles :
 * - "teach"    : l'élève demande une explication, un cours
 * - "evaluate" : l'élève soumet un exercice, demande une correction
 * - "motivate" : l'élève exprime du découragement, de la frustration
 *
 * Utilise Gemini pour classifier l'intention à partir du message
 * et de l'historique de conversation récent.
 */

import type { AgentState } from '@/types/chat';

export type Intent = 'teach' | 'evaluate' | 'motivate';

/**
 * Classifie l'intention de l'élève et met à jour l'état de l'agent.
 */
export async function routerNode(_state: AgentState): Promise<Partial<AgentState>> {
  // TODO: Appeler Gemini avec un prompt de classification
  // Analyser le dernier message + contexte pour déterminer l'intention
  // Retourner l'état mis à jour avec l'intention détectée

  throw new Error('Router node non implémenté');
}
