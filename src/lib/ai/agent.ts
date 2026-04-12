// src/lib/ai/agent.ts

/**
 * Agent LangGraph de Djeli.
 *
 * Architecture :
 *   __start__ → ROUTER → [TEACH | EVALUATE | MOTIVATE] → __end__
 *
 * Le routeur classifie l'intention de l'élève (teach / evaluate / motivate)
 * et dirige le flux vers le noeud spécialisé. Chaque noeud appelle Gemini
 * avec un prompt adapté et met à jour l'état de la conversation.
 *
 * Le helper `getGeminiModel` centralise l'instanciation du client Gemini
 * pour éviter de dupliquer la logique de gestion de la clé API.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import type { AgentState, Intent } from '@/types/chat';

/**
 * Annotation LangGraph décrivant l'état partagé entre les noeuds.
 * Chaque champ est stocké dans un canal `LastValue` (dernière écriture gagne),
 * ce qui correspond à la sémantique d'un pipeline linéaire sans fan-in.
 */
export const DjeliStateAnnotation = Annotation.Root({
  messages: Annotation<AgentState['messages']>(),
  lastUserMessage: Annotation<string>(),
  intent: Annotation<Intent | null>(),
  level: Annotation<string>(),
  subject: Annotation<string>(),
  topic: Annotation<string>(),
  emotionalState: Annotation<AgentState['emotionalState']>(),
  mastery: Annotation<AgentState['mastery']>(),
  ragContext: Annotation<string | null>(),
  response: Annotation<string | null>(),
  score: Annotation<number | null>(),
});

/** Type de l'état dérivé de l'annotation, utilisé par les noeuds. */
export type DjeliState = typeof DjeliStateAnnotation.State;

/**
 * Retourne une instance de modèle Gemini si la clé API est configurée.
 * Retourne `null` si la clé est absente — les noeuds peuvent alors basculer
 * sur un comportement dégradé plutôt que de planter.
 *
 * @param modelName - Nom du modèle Gemini (utiliser les constantes de `@/lib/ai/models`)
 */
export function getGeminiModel(modelName: string): GenerativeModel | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn(
      `[Agent] GOOGLE_AI_API_KEY non définie — modèle ${modelName} indisponible.`
    );
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Fonction de routage conditionnel après le noeud router.
 * Retourne le nom du prochain noeud selon l'intention détectée.
 */
function routeByIntent(state: DjeliState): 'teach' | 'evaluate' | 'motivate' {
  switch (state.intent) {
    case 'evaluate':
      return 'evaluate';
    case 'motivate':
      return 'motivate';
    case 'teach':
    default:
      return 'teach';
  }
}

/**
 * Construit et compile le graphe LangGraph de l'agent Djeli.
 *
 * Les imports des noeuds sont dynamiques pour éviter les cycles d'import
 * (router.ts importe déjà `getGeminiModel` et `DjeliStateAnnotation` depuis ce fichier).
 */
export async function createAgent() {
  const [{ routerNode }, { teachNode }, { evaluateNode }, { motivateNode }] =
    await Promise.all([
      import('@/lib/ai/nodes/router'),
      import('@/lib/ai/nodes/teach'),
      import('@/lib/ai/nodes/evaluate'),
      import('@/lib/ai/nodes/motivate'),
    ]);

  const graph = new StateGraph(DjeliStateAnnotation)
    .addNode('router', routerNode)
    .addNode('teach', teachNode)
    .addNode('evaluate', evaluateNode)
    .addNode('motivate', motivateNode)
    .addEdge(START, 'router')
    .addConditionalEdges('router', routeByIntent, {
      teach: 'teach',
      evaluate: 'evaluate',
      motivate: 'motivate',
    })
    .addEdge('teach', END)
    .addEdge('evaluate', END)
    .addEdge('motivate', END);

  return graph.compile();
}

/**
 * Exécute l'agent sur un état initial et retourne l'état final.
 * Pour le streaming, utiliser directement la route API qui appelle Gemini
 * en mode stream (voir src/app/api/chat/route.ts).
 */
export async function runAgent(initialState: DjeliState): Promise<DjeliState> {
  const app = await createAgent();
  const finalState = await app.invoke(initialState);
  return finalState as DjeliState;
}
