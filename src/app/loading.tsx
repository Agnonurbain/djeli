// src/app/loading.tsx

/**
 * Loading UI par défaut — affiché pendant le streaming d'un Server Component
 * lent (récupération de session Supabase, fetch API, etc.).
 */

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500"
        aria-label="Chargement en cours"
        role="status"
      />
      <p className="mt-4 text-sm text-gray-500">Chargement…</p>
    </main>
  );
}
