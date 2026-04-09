// src/components/tableau/LatexRenderer.tsx
"use client";

import { useEffect, useRef } from "react";

interface LatexRendererProps {
  /** Expression LaTeX à rendre via KaTeX */
  latex: string;
  /** Mode bloc (centré) ou inline */
  displayMode?: boolean;
}

/**
 * Composant wrapper pour le rendu KaTeX.
 *
 * TODO: Importer katex et appeler katex.render() dans le useEffect.
 * KaTeX est utilisé à la place de MathJax pour sa légèreté
 * (important pour les appareils Android entrée de gamme en CI).
 */
export default function LatexRenderer({
  latex,
  displayMode = false,
}: LatexRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // TODO: Intégrer KaTeX ici
    // import("katex").then((katex) => {
    //   if (containerRef.current) {
    //     katex.default.render(latex, containerRef.current, { displayMode });
    //   }
    // });
  }, [latex, displayMode]);

  return (
    <span
      ref={containerRef}
      className={displayMode ? "block my-4 text-center text-lg" : "inline"}
      aria-label={`Formule mathématique : ${latex}`}
    >
      {/* Placeholder — affiche le LaTeX brut en attendant l'intégration KaTeX */}
      <code className="font-mono text-amber-300">{latex}</code>
    </span>
  );
}
