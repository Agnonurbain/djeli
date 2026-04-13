// src/hooks/useProgress.ts
'use client';

/**
 * Hook lecture progression élève.
 *
 * Lit la progression complète depuis /api/progress :
 *   - profil (xp, niveau, streak)
 *   - arbre de maîtrise (mastery_tree groupé par matière)
 *
 * Le mode offline (cache IndexedDB) est laissé pour l'Étape 8 (Service Worker).
 */

import { useCallback, useEffect, useState } from 'react';
import type { Mastery } from '@/types/chat';
import type { LevelProgress } from '@/lib/progress/xp';

export interface MasteryNode {
  id: string;
  subject: string;
  topic: string;
  masteryLevel: Mastery;
  exercisesCompleted: number;
  lastScore: number | null;
  updatedAt: string | null;
}

export interface ProgressData extends LevelProgress {
  /** Niveau scolaire de l'élève (6eme, tle, l1, ...) */
  studentLevel: string;
  /** Série de jours d'activité consécutifs */
  streakDays: number;
  /** Arbre de maîtrise complet, trié par matière puis par chapitre */
  masteryTree: MasteryNode[];
}

interface UseProgressReturn {
  /** Données de progression, ou null tant qu'elles ne sont pas chargées */
  data: ProgressData | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle (texte affichable à l'utilisateur) */
  error: string | null;
  /** Rafraîchir la progression depuis le serveur */
  refresh: () => Promise<void>;
}

/**
 * Hook React pour récupérer la progression de l'élève connecté.
 * À utiliser dans les Server Components côté client (page /arbre, header XP, ...).
 */
export function useProgress(): UseProgressReturn {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/progress', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          payload?.error ?? `Erreur ${response.status} lors du chargement.`
        );
      }

      const payload = (await response.json()) as ProgressData;
      setData(payload);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de charger la progression.';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
