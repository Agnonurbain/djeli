// src/components/tableau/TableauNoir.tsx
"use client";

import type { ReactNode } from "react";

interface TableauNoirProps {
  /** Contenu pédagogique affiché sur le tableau */
  children: ReactNode;
}

/**
 * Zone d'enseignement principale — simule un tableau noir.
 * Conteneur pour les messages IA, formules LaTeX, blocs de code
 * et exercices interactifs.
 */
export default function TableauNoir({ children }: TableauNoirProps) {
  return (
    <section
      className="relative mx-auto min-h-[60vh] w-full max-w-3xl rounded-xl bg-gray-900 p-6 text-white shadow-lg"
      aria-label="Tableau d'enseignement"
    >
      {/* Effet de craie / texture — à affiner avec un background SVG */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-800/30 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
