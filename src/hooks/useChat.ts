// src/hooks/useChat.ts
'use client';

/**
 * Hook de streaming SSE du LLM vers le tableau.
 *
 * Gère l'envoi de messages, la réception en streaming (Server-Sent Events)
 * depuis l'API /api/chat, et l'état de la conversation.
 */

import { useCallback, useRef, useState } from 'react';
import type { Message } from '@/types/chat';

interface UseChatOptions {
  /** Identifiant de session existante (optionnel, en crée une nouvelle sinon) */
  sessionId?: string;
  /** Matière en cours */
  subject?: string;
  /** Sujet/topic en cours */
  topic?: string;
}

interface UseChatReturn {
  /** Liste des messages de la conversation */
  messages: Message[];
  /** Indique si l'IA est en train de générer une réponse */
  isStreaming: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Envoie un message et déclenche le streaming de la réponse IA */
  sendMessage: (content: string) => Promise<void>;
  /** Réinitialise la conversation */
  reset: () => void;
}

export function useChat(_options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (_content: string) => {
    // TODO: Implémenter l'envoi du message et le streaming SSE
    // 1. Ajouter le message de l'utilisateur à la liste
    // 2. POST /api/chat avec le contenu et les options
    // 3. Lire le stream SSE et accumuler la réponse de l'IA
    // 4. Ajouter le message complet de l'IA à la liste
    setError('Chat non implémenté');
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, reset };
}
