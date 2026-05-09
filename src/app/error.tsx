// src/app/error.tsx
"use client";

/**
 * Error boundary global — affiché quand un Server Component plante
 * (erreur de fetch, exception non gérée, etc.).
 *
 * Doit être un Client Component ("use client") car il reçoit la fonction
 * reset() pour relancer le rendu côté client.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log côté client — Sentry ou autre service à brancher ici plus tard
    console.error("[Djeli] Erreur non gérée :", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        😔
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Quelque chose a mal tourné
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        Désolé, une erreur inattendue s&apos;est produite. Tu peux réessayer
        ou revenir à l&apos;accueil.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-gray-400">
          Code : {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Accueil
        </a>
      </div>
    </main>
  );
}
