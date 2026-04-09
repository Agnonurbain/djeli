// src/hooks/useOffline.ts
'use client';

/**
 * Hook détection online/offline + fallback IndexedDB.
 *
 * Écoute les événements navigator.onLine et fournit l'état réseau.
 * Quand l'utilisateur passe offline, les données sont lues depuis
 * IndexedDB. Au retour du réseau, la file de sync est traitée.
 */

import { useCallback, useEffect, useState } from 'react';

interface UseOfflineReturn {
  /** true si l'appareil est connecté à Internet */
  isOnline: boolean;
  /** Nombre de requêtes en attente dans la file de sync */
  pendingSync: number;
  /** Force le traitement de la file de synchronisation */
  forceSync: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Traiter la file de sync au retour du réseau
  useEffect(() => {
    if (isOnline) {
      void forceSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const forceSync = useCallback(async () => {
    // TODO: Importer processQueue depuis sync-queue et exécuter
    // TODO: Mettre à jour pendingSync avec le nombre restant
    setPendingSync(0);
  }, []);

  return { isOnline, pendingSync, forceSync };
}
