// src/hooks/useProgress.ts
'use client';

/**
 * Hook lecture/écriture progression élève.
 *
 * Lit et met à jour l'arbre de maîtrise (mastery_tree) de l'élève
 * depuis Supabase. Gère le cache local pour le mode offline.
 */

import { useCallback, useEffect, useState } from 'react';

interface MasteryNode {
  id: string;
  subject: string;
  topic: string;
  masteryLevel: 'novice' | 'apprenti' | 'confirme' | 'expert' | 'maitre';
  exercisesCompleted: number;
  lastScore: number | null;
}

interface UseProgressReturn {
  /** Arbre de maîtrise de l'élève */
  masteryTree: MasteryNode[];
  /** XP total de l'élève */
  xp: number;
  /** Série de jours consécutifs d'activité */
  streakDays: number;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Rafraîchir la progression depuis le serveur */
  refresh: () => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [masteryTree, _setMasteryTree] = useState<MasteryNode[]>([]);
  const [xp, _setXp] = useState(0);
  const [streakDays, _setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // TODO: Charger la progression depuis /api/progress
    // Avec fallback IndexedDB si offline
    setIsLoading(false);
    setError('Progression non implémentée');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { masteryTree, xp, streakDays, isLoading, error, refresh };
}
