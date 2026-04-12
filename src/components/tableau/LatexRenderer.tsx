// src/components/tableau/LatexRenderer.tsx
"use client";

import { useEffect, useRef } from "react";
import katex from "katex";

interface LatexRendererProps {
  /** Expression LaTeX à rendre via KaTeX */
  latex: string;
  /** Mode bloc (centré) ou inline */
  displayMode?: boolean;
}

/**
 * Rendu KaTeX d'une expression LaTeX.
 *
 * KaTeX est utilisé à la place de MathJax pour sa légèreté et sa vitesse,
 * critique pour les appareils Android entrée de gamme ciblés par Djeli.
 *
 * En cas d'erreur de parsing LaTeX, le texte brut est affiché en fallback
 * dans la couleur d'erreur — l'élève peut alors comprendre le problème.
 */
export default function LatexRenderer({
  latex,
  displayMode = false,
}: LatexRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      katex.render(latex, containerRef.current, {
        displayMode,
        throwOnError: false,
        // `strict: false` autorise certaines commandes non standard utilisées
        // occasionnellement par les LLM sans planter tout le rendu.
        strict: false,
        output: "html",
      });
    } catch {
      // Secours : affichage du LaTeX brut en monospace rouge
      if (containerRef.current) {
        containerRef.current.textContent = latex;
        containerRef.current.className =
          "font-mono text-red-400 text-xs whitespace-pre-wrap";
      }
    }
  }, [latex, displayMode]);

  return (
    <span
      ref={containerRef}
      className={displayMode ? "block my-4 text-center" : "inline"}
      aria-label={`Formule mathématique : ${latex}`}
    />
  );
}
