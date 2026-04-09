// src/lib/offline/sync-queue.ts

/**
 * File d'attente pour synchronisation des réponses offline.
 *
 * Quand l'élève répond à un exercice ou envoie un message sans connexion,
 * la requête est stockée dans IndexedDB. Au retour du réseau, les requêtes
 * sont rejouées dans l'ordre via la Background Sync API.
 */

import { getDB } from '@/lib/offline/db';

const MAX_RETRIES = 5;

/**
 * Ajoute une requête à la file de synchronisation offline.
 */
export async function enqueue(
  endpoint: string,
  method: string,
  body: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  await db.add('syncQueue', {
    endpoint,
    method,
    body: JSON.stringify(body),
    createdAt: Date.now(),
    retries: 0,
  });

  // Demander une synchronisation au SW si Background Sync est disponible
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('djeli-sync');
  }
}

/**
 * Traite toutes les requêtes en attente dans la file.
 * Appelé par le Service Worker lors d'un événement sync,
 * ou manuellement au retour de la connexion.
 */
export async function processQueue(): Promise<void> {
  const db = await getDB();
  const pending = await db.getAllFromIndex('syncQueue', 'by-created-at');

  for (const item of pending) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });

      if (response.ok) {
        // Suppression de la file après succès
        if (item.id !== undefined) {
          await db.delete('syncQueue', item.id);
        }
      } else if (item.retries < MAX_RETRIES) {
        // Incrémenter le compteur de tentatives
        await db.put('syncQueue', { ...item, retries: item.retries + 1 });
      } else {
        // Trop de tentatives — supprimer (éviter accumulation infinie)
        if (item.id !== undefined) {
          await db.delete('syncQueue', item.id);
        }
      }
    } catch {
      // Pas de réseau — on réessaiera au prochain sync
      if (item.retries < MAX_RETRIES) {
        await db.put('syncQueue', { ...item, retries: item.retries + 1 });
      }
    }
  }
}
