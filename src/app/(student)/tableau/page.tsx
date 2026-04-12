// src/app/(student)/tableau/page.tsx
"use client";

/**
 * Tableau Noir — interface principale de chat avec l'agent IA.
 *
 * Base minimale MVP :
 * - Sélecteur de matière (quick pills)
 * - Chat streaming SSE via `useChat`
 * - Rendu markdown + KaTeX via MessageBubble
 * - Avatar Chibi (placeholder, à remplacer par Rive plus tard)
 */

import { useEffect, useRef, useState } from "react";
import ChibiAvatar from "@/components/chibi/ChibiAvatar";
import MessageBubble from "@/components/tableau/MessageBubble";
import ChatInput from "@/components/tableau/ChatInput";
import { useChat } from "@/hooks/useChat";

/** Matières proposées — liste simple pour le MVP */
const SUBJECTS: Array<{ id: string; label: string; icon: string }> = [
  { id: "mathematiques", label: "Maths", icon: "➗" },
  { id: "francais", label: "Français", icon: "📚" },
  { id: "physique_chimie", label: "Physique-Chimie", icon: "⚗️" },
  { id: "svt", label: "SVT", icon: "🌱" },
  { id: "histoire_geo", label: "Histoire-Géo", icon: "🌍" },
  { id: "anglais", label: "Anglais", icon: "🇬🇧" },
  { id: "philosophie", label: "Philosophie", icon: "💭" },
  { id: "general", label: "Général", icon: "✨" },
];

export default function TableauNoirPage() {
  const [subject, setSubject] = useState<string>("general");
  const { messages, isStreaming, error, sendMessage, stop } = useChat({
    subject,
  });

  // Auto-scroll vers le dernier message
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Header : avatar + matière courante */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <ChibiAvatar
            emotion={isStreaming ? "thinking" : "happy"}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-gray-900">
              Prof Chibi
            </h1>
            <p className="text-xs text-gray-500">
              {isStreaming
                ? "Réfléchit…"
                : "Pose-moi une question, je suis là pour t'aider."}
            </p>
          </div>
        </div>

        {/* Sélecteur de matière (pills scrollables) */}
        <nav
          className="flex gap-2 overflow-x-auto px-4 pb-3"
          aria-label="Choix de la matière"
        >
          {SUBJECTS.map((s) => {
            const active = s.id === subject;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                disabled={isStreaming}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                  active
                    ? "bg-amber-500 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-pressed={active}
              >
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Zone de messages */}
      <section
        className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ChibiAvatar emotion="excited" size={96} />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Bonjour ! Prêt à apprendre ?
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              Choisis une matière ci-dessus et pose-moi ta question.
              Je peux t&apos;expliquer un cours, corriger un exercice,
              ou t&apos;aider à progresser.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isAi = msg.role === "assistant";
          const isLast = idx === messages.length - 1;
          return (
            <MessageBubble
              key={msg.id}
              content={msg.content || (isAi && isLast && isStreaming ? "…" : "")}
              isAi={isAi}
              isStreaming={isAi && isLast && isStreaming}
            />
          );
        })}

        {error && (
          <div
            role="alert"
            className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </section>

      {/* Zone de saisie (sticky bas) */}
      <footer className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <ChatInput
            onSend={sendMessage}
            onStop={stop}
            isStreaming={isStreaming}
          />
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Prof Chibi peut se tromper. Vérifie les informations importantes.
          </p>
        </div>
      </footer>
    </main>
  );
}
