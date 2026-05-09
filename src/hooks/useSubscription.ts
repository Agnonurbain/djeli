// src/hooks/useSubscription.ts
'use client';

/**
 * Hook statut premium de l'utilisateur.
 *
 * Appelle GET /api/subscription pour vérifier si l'utilisateur
 * a un abonnement Premium actif et combien d'interactions IA
 * lui restent aujourd'hui (quota quotidien plan gratuit).
 */

import { useCallback, useEffect, useState } from 'react';
import { PLANS } from '@/lib/payment/plans';

interface UseSubscriptionReturn {
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  remainingInteractions: number;
  dailyLimit: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<Date | null>(null);
  const [remainingInteractions, setRemainingInteractions] = useState(
    PLANS.free.dailyInteractions
  );
  const [dailyLimit, setDailyLimit] = useState<number | null>(PLANS.free.dailyInteractions);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setIsPremium(data.isPremium ?? false);
      setPremiumExpiresAt(
        data.premiumExpiresAt ? new Date(data.premiumExpiresAt) : null
      );
      setRemainingInteractions(
        data.remainingInteractions === null
          ? Infinity
          : data.remainingInteractions
      );
      setDailyLimit(data.dailyLimit ?? null);
    } catch {
      // Réseau indisponible — on garde les valeurs par défaut (gratuit)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { isPremium, premiumExpiresAt, remainingInteractions, dailyLimit, isLoading, refresh };
}
