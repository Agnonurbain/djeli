// src/app/(student)/arbre/page.tsx
"use client";

/**
 * Arbre de Maîtrise — page de progression de l'élève.
 *
 * Base minimale MVP :
 * - Header : XPBar globale + niveau actuel + streak
 * - Liste groupée par matière → chapitre, badge de palier (novice → maître)
 * - État vide encourageant si aucun exercice fait
 *
 * La vue arborescente SVG/D3 viendra plus tard (Étape 7+).
 */

import { useMemo } from "react";
import Link from "next/link";
import XPBar from "@/components/progression/XPBar";
import { useProgress, type MasteryNode } from "@/hooks/useProgress";
import { MASTERY_LABELS, masteryPercent } from "@/lib/progress/xp";
import type { Mastery } from "@/types/chat";

/**
 * Couleur Tailwind par palier de maîtrise (badge + barre de progression).
 * Choisi pour rester lisible sur fond clair (page /arbre fond blanc).
 */
const MASTERY_STYLES: Record<Mastery, { badge: string; bar: string }> = {
  novice: {
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    bar: "bg-gray-400",
  },
  apprenti: {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    bar: "bg-amber-400",
  },
  confirme: {
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
    bar: "bg-emerald-500",
  },
  expert: {
    badge: "bg-sky-100 text-sky-900 border-sky-200",
    bar: "bg-sky-500",
  },
  maitre: {
    badge: "bg-violet-100 text-violet-900 border-violet-200",
    bar: "bg-violet-500",
  },
};

/**
 * Libellés français des matières — fallback sur l'id si non listée.
 * Aligné avec SUBJECTS de tableau/page.tsx.
 */
const SUBJECT_LABELS: Record<string, { label: string; icon: string }> = {
  mathematiques: { label: "Mathématiques", icon: "➗" },
  francais: { label: "Français", icon: "📚" },
  physique_chimie: { label: "Physique-Chimie", icon: "⚗️" },
  svt: { label: "SVT", icon: "🌱" },
  histoire_geo: { label: "Histoire-Géo", icon: "🌍" },
  anglais: { label: "Anglais", icon: "🇬🇧" },
  philosophie: { label: "Philosophie", icon: "💭" },
  general: { label: "Général", icon: "✨" },
};

function subjectMeta(subjectId: string): { label: string; icon: string } {
  return (
    SUBJECT_LABELS[subjectId] ?? {
      label: subjectId,
      icon: "📘",
    }
  );
}

export default function ArbreDeMaitrisePage() {
  const { data, isLoading, error, refresh } = useProgress();

  // Grouper les noeuds par matière (le serveur les renvoie déjà triés)
  const grouped = useMemo(() => {
    if (!data) return [] as Array<{ subject: string; nodes: MasteryNode[] }>;
    const map = new Map<string, MasteryNode[]>();
    for (const node of data.masteryTree) {
      const list = map.get(node.subject) ?? [];
      list.push(node);
      map.set(node.subject, list);
    }
    return Array.from(map.entries()).map(([subject, nodes]) => ({
      subject,
      nodes,
    }));
  }, [data]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Arbre de Maîtrise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Suis ta progression matière par matière, chapitre par chapitre.
        </p>
      </header>

      {/* Bloc XP / niveau / streak */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-gray-900 p-5 text-white shadow-sm">
        {isLoading && (
          <p className="text-sm text-gray-300">Chargement de ta progression…</p>
        )}

        {error && !isLoading && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="self-start rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-gray-900 hover:bg-amber-400"
            >
              Réessayer
            </button>
          </div>
        )}

        {data && !error && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Niveau
                </p>
                <p className="text-3xl font-bold text-amber-400">
                  {data.currentLevel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Série
                </p>
                <p className="text-lg font-semibold">
                  {data.streakDays} <span aria-hidden>🔥</span>
                  <span className="sr-only">jours consécutifs</span>
                </p>
              </div>
            </div>

            <XPBar
              xp={data.xpInCurrentLevel}
              maxXp={Math.max(1, data.xpSpanCurrentLevel)}
            />

            <p className="text-xs text-gray-400">
              {data.xpForNextLevel - data.totalXp} XP avant le niveau{" "}
              {data.currentLevel + 1}
            </p>
          </div>
        )}
      </section>

      {/* Liste de l'arbre */}
      {data && !error && grouped.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-base font-semibold text-gray-900">
            Ton arbre est vide pour l&apos;instant.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Va sur le Tableau Noir, choisis une matière et fais ton premier
            exercice — chaque chapitre travaillé apparaîtra ici.
          </p>
          <Link
            href="/tableau"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400"
          >
            Aller au Tableau Noir
          </Link>
        </div>
      )}

      {grouped.length > 0 && (
        <ul className="space-y-6">
          {grouped.map(({ subject, nodes }) => {
            const meta = subjectMeta(subject);
            return (
              <li key={subject}>
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span aria-hidden>{meta.icon}</span>
                  {meta.label}
                </h2>
                <ul className="space-y-2">
                  {nodes.map((node) => {
                    const styles = MASTERY_STYLES[node.masteryLevel];
                    const percent = masteryPercent(node.masteryLevel);
                    return (
                      <li
                        key={node.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900">
                            {node.topic}
                          </p>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
                          >
                            {MASTERY_LABELS[node.masteryLevel]}
                          </span>
                        </div>
                        <div
                          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Maîtrise du chapitre ${node.topic} : ${percent}%`}
                        >
                          <div
                            className={`h-full transition-[width] duration-500 ease-out ${styles.bar}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {node.exercisesCompleted} exercice
                            {node.exercisesCompleted > 1 ? "s" : ""} validé
                            {node.exercisesCompleted > 1 ? "s" : ""}
                          </span>
                          {node.lastScore !== null && (
                            <span>
                              Dernier score : {Math.round(node.lastScore * 100)}%
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
