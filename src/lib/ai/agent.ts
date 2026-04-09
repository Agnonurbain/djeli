// src/lib/ai/agent.ts

/**
 * Définition de l'agent LangGraph avec les noeuds router, teach, evaluate, motivate.
 *
 * Architecture :
 *   Input → ROUTER → [TEACH | EVALUATE | MOTIVATE] → MEMORY
 *
 * Le graphe est construit avec LangGraph (TypeScript) et orchestre
 * l'appel à Gemini 1.5 Pro selon l'intention détectée.
 */

import type { AgentState } from '@/types/chat';

// TODO: Importer les noeuds depuis ./nodes/
// import { routerNode } from '@/lib/ai/nodes/router';
// import { teachNode } from '@/lib/ai/nodes/teach';
// import { evaluateNode } from '@/lib/ai/nodes/evaluate';
// import { motivateNode } from '@/lib/ai/nodes/motivate';

/**
 * Crée et retourne le graphe LangGraph de l'agent Djeli.
 * Le graphe route la conversation selon l'intention de l'élève :
 * - teach : cours socratique avec RAG
 * - evaluate : correction d'exercices et notation
 * - motivate : détection de découragement et encouragement
 */
export async function createAgent() {
  // TODO: Construire le StateGraph LangGraph
  // const graph = new StateGraph<AgentState>({ ... });
  // graph.addNode('router', routerNode);
  // graph.addNode('teach', teachNode);
  // graph.addNode('evaluate', evaluateNode);
  // graph.addNode('motivate', motivateNode);
  // graph.addEdge('__start__', 'router');
  // graph.addConditionalEdges('router', routeByIntent);
  // return graph.compile();

  throw new Error('Agent non implémenté — en attente de LangGraph setup');
}

/**
 * Exécute l'agent sur un état de conversation donné.
 */
export async function runAgent(_state: AgentState): Promise<AgentState> {
  // TODO: Implémenter l'exécution du graphe
  throw new Error('Agent non implémenté — en attente de LangGraph setup');
}
