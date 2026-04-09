// src/types/chat.ts

/**
 * Types pour les conversations IA et l'état de l'agent LangGraph.
 */

/** Rôle de l'auteur d'un message */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Niveau de maîtrise d'un topic */
export type Mastery = 'novice' | 'apprenti' | 'confirme' | 'expert' | 'maitre';

/** Intention détectée par le routeur de l'agent */
export type Intent = 'teach' | 'evaluate' | 'motivate';

/** État émotionnel détecté chez l'élève */
export type EmotionalState = 'neutre' | 'motive' | 'decourage' | 'frustre' | 'ennuye';

/** Message individuel dans une conversation */
export interface Message {
  /** Identifiant unique du message */
  id: string;
  /** Rôle de l'auteur */
  role: MessageRole;
  /** Contenu textuel (peut contenir du KaTeX et du code) */
  content: string;
  /** Horodatage de création */
  timestamp: Date;
  /** Métadonnées optionnelles (score, intent, etc.) */
  metadata?: Record<string, unknown>;
}

/** Session de conversation avec l'IA */
export interface ChatSession {
  /** Identifiant unique de la session */
  id: string;
  /** Identifiant de l'élève */
  studentId: string;
  /** Matière de la session */
  subject: string | null;
  /** Topic / chapitre de la session */
  topic: string | null;
  /** Liste des messages de la conversation */
  messages: Message[];
  /** Date de création */
  createdAt: Date;
  /** Date de dernière mise à jour */
  updatedAt: Date;
}

/**
 * État de l'agent LangGraph.
 * Passé entre les noeuds du graphe (router, teach, evaluate, motivate).
 */
export interface AgentState {
  /** Messages de la conversation en cours */
  messages: Message[];
  /** Dernier message de l'utilisateur */
  lastUserMessage: string;
  /** Intention détectée par le routeur */
  intent: Intent | null;
  /** Niveau scolaire de l'élève */
  level: string;
  /** Matière en cours */
  subject: string;
  /** Topic en cours */
  topic: string;
  /** État émotionnel détecté */
  emotionalState: EmotionalState;
  /** Niveau de maîtrise du topic actuel */
  mastery: Mastery;
  /** Contexte RAG récupéré (documents pertinents) */
  ragContext: string | null;
  /** Réponse générée par l'IA (streaming) */
  response: string | null;
  /** Score attribué (pour le noeud evaluate) */
  score: number | null;
}
