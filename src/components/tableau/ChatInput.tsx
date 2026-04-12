// src/components/tableau/ChatInput.tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

interface ChatInputProps {
  /** Callback appelé à l'envoi d'un message */
  onSend: (content: string) => void;
  /** Callback pour annuler le streaming en cours */
  onStop?: () => void;
  /** true si l'IA est en train de générer une réponse */
  isStreaming?: boolean;
  /** true si l'input doit être désactivé (ex: déconnecté) */
  disabled?: boolean;
  /** Placeholder affiché dans l'input */
  placeholder?: string;
}

/** Nombre maximum de caractères par message (aligné avec le Zod schema) */
const MAX_LENGTH = 4000;

/** Hauteur maximale du textarea avant scroll (en pixels) */
const MAX_TEXTAREA_HEIGHT = 160;

/**
 * Zone de saisie du Tableau Noir. Textarea auto-resize + bouton envoi.
 * `Enter` = envoi, `Shift+Enter` = nouvelle ligne.
 * Pendant le streaming, le bouton devient un "Stop" pour annuler.
 */
export default function ChatInput({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = "Pose ta question à Prof Chibi…",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize du textarea selon le contenu
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, isStreaming, disabled, onSend]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Message à envoyer à Prof Chibi"
        className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
      />

      {isStreaming && onStop ? (
        <button
          type="button"
          onClick={onStop}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label="Arrêter la génération"
        >
          <span className="block h-3 w-3 rounded-sm bg-white" aria-hidden />
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-gray-900 transition-colors hover:bg-amber-400 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          aria-label="Envoyer le message"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12l14-7-6 14-2-6-6-1z" />
          </svg>
        </button>
      )}
    </form>
  );
}
