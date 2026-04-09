// src/components/progression/StreakCounter.tsx

interface StreakCounterProps {
  /** Nombre de jours consécutifs d'apprentissage */
  days: number;
}

/**
 * Compteur de série (streak) — nombre de jours consécutifs
 * où l'élève a été actif. Élément de gamification pour
 * encourager la régularité.
 */
export default function StreakCounter({ days }: StreakCounterProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2">
      <span className="text-xl" role="img" aria-hidden>
        🔥
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight text-orange-400">
          {days}
        </span>
        <span className="text-xs text-orange-300/70">
          {days <= 1 ? "jour" : "jours"}
        </span>
      </div>
    </div>
  );
}
