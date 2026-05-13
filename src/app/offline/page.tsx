// src/app/offline/page.tsx
"use client";

/**
 * Page de secours affichée par le Service Worker quand le réseau
 * est indisponible et qu'aucune version cachée de la page demandée
 * n'existe. Ultra légère — pas d'appel réseau, pas de composants lourds.
 */

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 text-center text-white">
      <div className="text-6xl" aria-hidden>
        📡
      </div>
      <h1 className="mt-4 text-2xl font-bold">Pas de connexion</h1>
      <p className="mt-3 max-w-sm text-sm text-gray-300">
        Ton téléphone n&apos;est pas connecté à Internet. Vérifie ta connexion
        Wi-Fi ou tes données mobiles, puis réessaie.
      </p>
      <p className="mt-6 text-sm text-gray-400">
        Tes réponses aux exercices seront envoyées automatiquement dès
        que la connexion sera rétablie.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-amber-400"
      >
        Réessayer
      </button>
    </main>
  );
}
