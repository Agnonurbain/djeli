// src/components/tableau/MessageBubble.tsx
"use client";

import { Fragment, type ReactNode } from "react";
import LatexRenderer from "./LatexRenderer";

interface MessageBubbleProps {
  /** Contenu du message (peut contenir markdown + LaTeX) */
  content: string;
  /** true si le message vient de l'IA (Prof Chibi), false si c'est l'élève */
  isAi: boolean;
  /** true si la réponse IA est en cours de streaming */
  isStreaming?: boolean;
}

/**
 * Segment parsé dans un message : texte brut ou formule LaTeX.
 * Les blocs de code (```) ne sont pas encore gérés — c'est un futur besoin.
 */
type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; displayMode: boolean };

/**
 * Parse un texte contenant du LaTeX inline `$...$` ou bloc `$$...$$`
 * et retourne la liste des segments à rendre. Les `$` échappés (`\$`)
 * sont préservés comme texte brut.
 */
function parseMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Ordre : $$...$$ (bloc) puis $...$ (inline). On capture aussi
  // les éventuels `\$` littéraux pour ne pas les traiter comme délimiteurs.
  const pattern = /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }
    if (match[1] !== undefined) {
      // Bloc $$...$$
      segments.push({ type: "math", value: match[1], displayMode: true });
    } else if (match[2] !== undefined) {
      // Inline $...$
      segments.push({ type: "math", value: match[2], displayMode: false });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Rendu inline d'un segment texte avec un markdown minimaliste :
 *   **gras**, *italique*, `code inline`. Les sauts de ligne sont préservés.
 *
 * On évite volontairement une lib markdown complète (react-markdown)
 * pour limiter la taille du bundle — critique pour les réseaux 3G ivoiriens.
 */
function renderTextSegment(text: string, keyPrefix: string): ReactNode {
  // Séparer par lignes pour préserver les sauts de ligne
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Parse inline : gras, italique, code
    const parts: ReactNode[] = [];
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIdx = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Fragment key={`${keyPrefix}-${lineIdx}-t-${partIdx++}`}>
            {line.slice(lastIndex, match.index)}
          </Fragment>
        );
      }
      const token = match[0];
      if (token.startsWith("**")) {
        parts.push(
          <strong key={`${keyPrefix}-${lineIdx}-b-${partIdx++}`}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("*")) {
        parts.push(
          <em key={`${keyPrefix}-${lineIdx}-i-${partIdx++}`}>
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith("`")) {
        parts.push(
          <code
            key={`${keyPrefix}-${lineIdx}-c-${partIdx++}`}
            className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[0.9em] text-gray-900"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(
        <Fragment key={`${keyPrefix}-${lineIdx}-t-${partIdx++}`}>
          {line.slice(lastIndex)}
        </Fragment>
      );
    }

    return (
      <Fragment key={`${keyPrefix}-line-${lineIdx}`}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </Fragment>
    );
  });
}

/**
 * Bulle de message — rend texte + formules LaTeX.
 * Style différent selon l'auteur (IA vs élève).
 */
export default function MessageBubble({
  content,
  isAi,
  isStreaming = false,
}: MessageBubbleProps) {
  const segments = parseMathSegments(content);

  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAi
            ? "rounded-tl-none bg-amber-50 text-gray-900"
            : "rounded-tr-none bg-blue-600 text-white"
        }`}
      >
        {isAi && (
          <span className="mb-1 block text-xs font-semibold text-amber-700">
            Prof Chibi
          </span>
        )}
        <div className="whitespace-normal">
          {segments.map((seg, idx) =>
            seg.type === "math" ? (
              <LatexRenderer
                key={`math-${idx}`}
                latex={seg.value}
                displayMode={seg.displayMode}
              />
            ) : (
              <Fragment key={`text-${idx}`}>
                {renderTextSegment(seg.value, `s${idx}`)}
              </Fragment>
            )
          )}
          {isStreaming && (
            <span
              className="ml-1 inline-block h-4 w-2 animate-pulse bg-current align-middle"
              aria-label="En train d'écrire"
            />
          )}
        </div>
      </div>
    </div>
  );
}
