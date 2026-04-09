// src/components/progression/MasteryTree.tsx
"use client";

import { useRef } from "react";

interface MasteryNode {
  id: string;
  label: string;
  /** Niveau de maîtrise de 0 (non commencé) à 100 (maîtrisé) */
  mastery: number;
  /** IDs des nœuds prérequis */
  parentIds: string[];
}

interface MasteryTreeProps {
  /** Liste des compétences à afficher dans l'arbre */
  nodes: MasteryNode[];
}

/**
 * Arbre de maîtrise des compétences — visualisation SVG/Canvas.
 * Affiche la progression de l'élève par matière sous forme d'arbre
 * de compétences interconnectées.
 *
 * TODO: Implémenter le rendu SVG avec des nœuds et des arêtes.
 * Chaque nœud change de couleur selon le niveau de maîtrise.
 */
export default function MasteryTree({ nodes }: MasteryTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-auto rounded-xl bg-gray-900 p-6"
      aria-label="Arbre de maîtrise des compétences"
    >
      {/* Placeholder — sera remplacé par un rendu SVG interactif */}
      <div className="flex flex-wrap gap-3">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm"
            style={{
              backgroundColor: `rgba(251, 191, 36, ${node.mastery / 100})`,
              color: node.mastery > 50 ? "#1f2937" : "#e5e7eb",
            }}
          >
            <span className="font-medium">{node.label}</span>
            <span className="ml-2 text-xs opacity-75">{node.mastery}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
