// src/components/progression/MasteryTree.tsx
"use client";

import { useMemo } from "react";

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
  /** Callback quand l'élève clique sur un nœud */
  onNodeClick?: (id: string) => void;
}

/** Dimensions d'un nœud + espacement */
const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const GAP_X = 40;
const GAP_Y = 70;

/**
 * Calcule la profondeur (niveau dans l'arbre) de chaque nœud par tri
 * topologique. Un nœud sans parents est à la profondeur 0, sinon sa
 * profondeur est `max(profondeur des parents) + 1`.
 */
function computeDepths(nodes: MasteryNode[]): Map<string, number> {
  const depths = new Map<string, number>();
  const byId = new Map(nodes.map((n) => [n.id, n]));

  function depth(id: string, seen: Set<string>): number {
    if (depths.has(id)) return depths.get(id)!;
    if (seen.has(id)) return 0; // cycle protection
    seen.add(id);

    const node = byId.get(id);
    if (!node || node.parentIds.length === 0) {
      depths.set(id, 0);
      return 0;
    }

    const parentDepths = node.parentIds
      .filter((p) => byId.has(p))
      .map((p) => depth(p, seen));
    const d = parentDepths.length === 0 ? 0 : Math.max(...parentDepths) + 1;
    depths.set(id, d);
    return d;
  }

  for (const n of nodes) depth(n.id, new Set());
  return depths;
}

/**
 * Couleur du nœud selon le niveau de maîtrise.
 * Palette ambre (Djeli) avec dégradé selon la progression.
 */
function nodeColor(mastery: number): { bg: string; border: string; text: string } {
  if (mastery >= 80) return { bg: "#7c3aed", border: "#a78bfa", text: "#ffffff" };
  if (mastery >= 60) return { bg: "#0ea5e9", border: "#38bdf8", text: "#ffffff" };
  if (mastery >= 40) return { bg: "#10b981", border: "#34d399", text: "#ffffff" };
  if (mastery >= 20) return { bg: "#f59e0b", border: "#fbbf24", text: "#1f2937" };
  return { bg: "#374151", border: "#4b5563", text: "#d1d5db" };
}

/**
 * Arbre de maîtrise des compétences — visualisation SVG.
 *
 * Algorithme de layout :
 *   1. Calcul de la profondeur de chaque nœud (tri topologique)
 *   2. Groupement par profondeur
 *   3. Centrage horizontal de chaque rangée
 *   4. Tracé des arêtes (Bézier) entre parents et enfants
 */
export default function MasteryTree({ nodes, onNodeClick }: MasteryTreeProps) {
  const layout = useMemo(() => {
    const depths = computeDepths(nodes);

    // Grouper par profondeur
    const byDepth = new Map<number, MasteryNode[]>();
    for (const node of nodes) {
      const d = depths.get(node.id) ?? 0;
      const list = byDepth.get(d) ?? [];
      list.push(node);
      byDepth.set(d, list);
    }

    const depthKeys = Array.from(byDepth.keys());
    const depthValues = Array.from(byDepth.values());
    const maxDepth = depthKeys.length === 0 ? 0 : Math.max(...depthKeys);
    const maxRowSize =
      depthValues.length === 0
        ? 1
        : Math.max(...depthValues.map((row) => row.length));

    // Largeur totale dictée par la rangée la plus large
    const width = Math.max(
      maxRowSize * (NODE_WIDTH + GAP_X) + GAP_X,
      NODE_WIDTH + GAP_X * 2
    );
    const height = (maxDepth + 1) * (NODE_HEIGHT + GAP_Y) + GAP_Y;

    // Position de chaque nœud
    const positions = new Map<string, { x: number; y: number }>();
    Array.from(byDepth.entries()).forEach(([d, row]: [number, MasteryNode[]]) => {
      const rowWidth = row.length * NODE_WIDTH + (row.length - 1) * GAP_X;
      const startX = (width - rowWidth) / 2;
      row.forEach((node, i) => {
        positions.set(node.id, {
          x: startX + i * (NODE_WIDTH + GAP_X),
          y: d * (NODE_HEIGHT + GAP_Y) + GAP_Y / 2,
        });
      });
    });

    return { positions, width, height };
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900 p-8 text-center text-sm text-gray-400">
        Aucune compétence à afficher pour l&apos;instant.
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-auto rounded-xl bg-gray-900 p-4"
      aria-label="Arbre de maîtrise des compétences"
    >
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block"
      >
        {/* Arêtes parent → enfant */}
        <g aria-hidden>
          {nodes.flatMap((node) => {
            const childPos = layout.positions.get(node.id);
            if (!childPos) return [];
            return node.parentIds.flatMap((parentId) => {
              const parentPos = layout.positions.get(parentId);
              if (!parentPos) return [];
              const x1 = parentPos.x + NODE_WIDTH / 2;
              const y1 = parentPos.y + NODE_HEIGHT;
              const x2 = childPos.x + NODE_WIDTH / 2;
              const y2 = childPos.y;
              const midY = (y1 + y2) / 2;
              return [
                <path
                  key={`${parentId}-${node.id}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  stroke="#4b5563"
                  strokeWidth={2}
                  fill="none"
                />,
              ];
            });
          })}
        </g>

        {/* Nœuds */}
        <g>
          {nodes.map((node) => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;
            const colors = nodeColor(node.mastery);
            const isInteractive = !!onNodeClick;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x} ${pos.y})`}
                className={isInteractive ? "cursor-pointer" : ""}
                onClick={() => onNodeClick?.(node.id)}
                role={isInteractive ? "button" : "img"}
                aria-label={`${node.label} — maîtrise ${node.mastery}%`}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={10}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={2}
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 - 4}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={13}
                  fontWeight={600}
                  className="select-none"
                >
                  {node.label.length > 18
                    ? `${node.label.slice(0, 16)}…`
                    : node.label}
                </text>
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 + 14}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={11}
                  opacity={0.85}
                  className="select-none"
                >
                  {node.mastery}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
