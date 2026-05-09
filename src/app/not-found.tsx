// src/app/not-found.tsx

/**
 * Page 404 globale — affichée quand Next.js ne trouve pas de route correspondant
 * à l'URL. C'est un Server Component (pas "use client") pour rester léger.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="text-6xl font-bold text-amber-500" aria-hidden>
        404
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page introuvable</h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        Cette page n&apos;existe pas ou a été déplacée. Reviens à l&apos;accueil
        pour continuer ton apprentissage avec Prof Chibi.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
