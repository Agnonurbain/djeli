// src/app/(student)/tableau/inviter/page.tsx
"use client";

/**
 * Page "Inviter un parent" — côté élève.
 *
 * L'élève demande un code à 6 caractères (valide 15 min), que son parent
 * saisira ensuite dans son dashboard pour confirmer le lien. Un seul code
 * est actif à la fois : générer un nouveau code invalide le précédent.
 *
 * Le code est affiché en grand pour être lu à voix haute, partagé par SMS
 * ou recopié. Bouton "Copier" pour le presse-papiers.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface LinkState {
  pendingCode: string | null;
  pendingExpiresAt: string | null;
  parents: Array<{ id: string; parent_id: string | null; created_at: string | null }>;
}

export default function InviterParentPage() {
  const [state, setState] = useState<LinkState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/link", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur");
      if (json.role !== "student") {
        throw new Error("Cette page est réservée aux élèves.");
      }
      setState({
        pendingCode: json.pendingCode ?? null,
        pendingExpiresAt: json.pendingExpiresAt ?? null,
        parents: json.parents ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur");
      setState((prev) => ({
        ...(prev ?? { parents: [] }),
        pendingCode: json.code,
        pendingExpiresAt: json.expiresAt,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  }

  async function copyCode() {
    if (!state?.pendingCode) return;
    try {
      await navigator.clipboard.writeText(state.pendingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard peut échouer sur HTTP (non-sécurisé) ou sans autorisation
    }
  }

  const expiresAt = state?.pendingExpiresAt
    ? new Date(state.pendingExpiresAt)
    : null;
  const expired = expiresAt !== null && expiresAt.getTime() < Date.now();
  const minutesLeft =
    expiresAt !== null
      ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000))
      : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
      <Link
        href="/tableau"
        className="text-sm text-gray-500 hover:underline"
      >
        ← Retour au Tableau Noir
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Inviter un parent</h1>
      <p className="mt-2 text-sm text-gray-600">
        Partage ce code avec ton parent pour qu&apos;il puisse suivre ta
        progression. Le code est valable 15 minutes.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-gray-500">Chargement…</p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!loading && state && (
        <>
          {state.pendingCode && !expired && (
            <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-amber-800">
                Ton code
              </p>
              <p className="mt-2 font-mono text-5xl font-bold tracking-widest text-gray-900">
                {state.pendingCode}
              </p>
              {minutesLeft !== null && (
                <p className="mt-2 text-xs text-amber-700">
                  Expire dans {minutesLeft} min
                </p>
              )}
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
                >
                  {copied ? "Copié ✓" : "Copier"}
                </button>
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={generating}
                  className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {generating ? "..." : "Nouveau code"}
                </button>
              </div>
            </section>
          )}

          {(!state.pendingCode || expired) && (
            <button
              type="button"
              onClick={() => void generate()}
              disabled={generating}
              className="mt-6 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {generating ? "Génération…" : "Générer un code d'appairage"}
            </button>
          )}

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900">
              Parents liés ({state.parents.length})
            </h2>
            {state.parents.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                Aucun parent lié pour l&apos;instant.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {state.parents.map((p) => (
                  <li key={p.id}>
                    Parent lié le{" "}
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
