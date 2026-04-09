// src/lib/offline/register-sw.ts

/**
 * Enregistrement du Service Worker pour le mode offline.
 * Le SW gère le cache statique (shell app, CSS, JS, assets Rive)
 * et le cache dynamique (cours, exercices récents).
 */

/**
 * Enregistre le Service Worker si le navigateur le supporte.
 * Appelé au montage de l'application (layout racine).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Vérification des mises à jour du SW
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          // Nouvelle version du SW activée — recharger pour appliquer
          // TODO: Afficher un toast "Mise à jour disponible" plutôt que recharger automatiquement
        }
      });
    });

    return registration;
  } catch (error) {
    // Échec silencieux — l'app fonctionne sans SW, juste sans offline
    console.error('Échec enregistrement Service Worker:', error);
    return null;
  }
}
