// src/components/progression/XPBar.tsx

interface XPBarProps {
  /** Points d'expérience actuels */
  xp: number;
  /** Points d'expérience nécessaires pour le prochain niveau */
  maxXp: number;
}

/**
 * Barre de progression d'expérience (XP).
 * Affiche visuellement la progression de l'élève vers le prochain niveau.
 */
export default function XPBar({ xp, maxXp }: XPBarProps) {
  const percentage = Math.min((xp / maxXp) * 100, 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>XP</span>
        <span>
          {xp} / {maxXp}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-gray-700"
        role="progressbar"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={maxXp}
        aria-label={`${xp} points d'expérience sur ${maxXp}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
