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
import { processQueue } from '@/lib/offline/sync-queue';
import { getDB } from '@/lib/offline/db';

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

  const refreshPendingCount = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count('syncQueue');
      setPendingSync(count);
    } catch {
      setPendingSync(0);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPendingCount]);

  const forceSync = useCallback(async () => {
    await processQueue();
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // Traiter la file de sync au retour du réseau
  useEffect(() => {
    if (isOnline) {
      void forceSync();
    }
  }, [isOnline, forceSync]);

  return { isOnline, pendingSync, forceSync };
}
