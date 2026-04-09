// src/hooks/useSubscription.ts
'use client';

/**
 * Hook statut premium de l'utilisateur.
 *
 * Vérifie si l'utilisateur a un abonnement Premium actif
 * et calcule les limites restantes (interactions IA/jour pour le plan gratuit).
 */

import { useCallback, useEffect, useState } from 'react';
import { PLANS } from '@/lib/payment/plans';

interface UseSubscriptionReturn {
  /** true si l'utilisateur est premium */
  isPremium: boolean;
  /** Date d'expiration du premium (null si gratuit) */
  premiumExpiresAt: Date | null;
  /** Nombre d'interactions IA restantes aujourd'hui */
  remainingInteractions: number;
  /** Chargement en cours */
  isLoading: boolean;
  /** Rafraîchir le statut depuis le serveur */
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isPremium, _setIsPremium] = useState(false);
  const [premiumExpiresAt, _setPremiumExpiresAt] = useState<Date | null>(null);
  const [remainingInteractions, _setRemainingInteractions] = useState(
    PLANS.free.dailyInteractions
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    // TODO: Appeler l'API pour vérifier le statut premium
    // et le nombre d'interactions restantes aujourd'hui
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { isPremium, premiumExpiresAt, remainingInteractions, isLoading, refresh };
}
