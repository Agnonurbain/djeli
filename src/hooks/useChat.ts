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
  /** Identifiant de la session créée (disponible après le 1er envoi) */
  sessionId: string | undefined;
  /** Indique si l'IA est en train de générer une réponse */
  isStreaming: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Envoie un message et déclenche le streaming de la réponse IA */
  sendMessage: (content: string) => Promise<void>;
  /** Annule le streaming en cours */
  stop: () => void;
  /** Réinitialise la conversation */
  reset: () => void;
}

/** Événement unitaire décodé depuis le flux SSE. */
type SSEEvent =
  | { content: string }
  | { done: true; sessionId: string }
  | { error: string; code?: string };

/**
 * Parse un bloc SSE complet (terminé par `\n\n`) et retourne la payload JSON.
 * Retourne `null` si le bloc ne contient pas de données parsables.
 */
function parseSSEBlock(block: string): SSEEvent | null {
  const dataLine = block
    .split('\n')
    .find((line) => line.startsWith('data:'));
  if (!dataLine) return null;
  const payload = dataLine.slice(5).trim();
  if (!payload) return null;
  try {
    return JSON.parse(payload) as SSEEvent;
  } catch {
    return null;
  }
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { subject, topic } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(
    options.sessionId
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      // 1. Ajouter le message utilisateur à la liste (optimistic update)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      // ID de la bulle IA en cours de streaming (mise à jour progressive)
      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsStreaming(true);

      // 2. Préparer l'AbortController pour pouvoir arrêter le streaming
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmed,
            sessionId,
            subject,
            topic,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          // Erreur JSON classique (pas de stream)
          const errorBody = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            errorBody?.error ?? `Erreur serveur (${response.status})`
          );
        }

        if (!response.body) {
          throw new Error('Flux de réponse vide.');
        }

        // 3. Lire le stream SSE et accumuler la réponse
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Découper par `\n\n` (fin de bloc SSE)
          let separatorIndex = buffer.indexOf('\n\n');
          while (separatorIndex !== -1) {
            const block = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            separatorIndex = buffer.indexOf('\n\n');

            const event = parseSSEBlock(block);
            if (!event) continue;

            if ('error' in event) {
              streamError = event.error;
              continue;
            }
            if ('done' in event) {
              setSessionId(event.sessionId);
              continue;
            }
            if ('content' in event) {
              accumulated += event.content;
              // Mise à jour progressive de la bulle IA
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: accumulated }
                    : msg
                )
              );
            }
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }
      } catch (err) {
        // Streaming annulé volontairement : pas une vraie erreur
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Erreur inconnue.';
        setError(message);
        // Retirer la bulle IA vide si elle n'a rien reçu
        setMessages((prev) =>
          prev.filter(
            (msg) => !(msg.id === assistantId && msg.content === '')
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, sessionId, subject, topic]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setSessionId(undefined);
    setIsStreaming(false);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    isStreaming,
    error,
    sendMessage,
    stop,
    reset,
  };
}
