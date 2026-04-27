// src/app/(parent)/dashboard/link/page.tsx
"use client";

/**
 * Saisie du code d'appairage côté parent.
 *
 * L'élève génère son code dans son espace Djeli (/tableau/inviter), le
 * communique à son parent (oralement ou par SMS), et le parent le saisit ici.
 *
 * On normalise la saisie : on force en MAJUSCULES, on retire les espaces,
 * et on limite à 6 caractères.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function ParentLinkPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    displayName: string | null;
    level: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", code }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Code invalide");
      }
      setSuccess(json.student);
      // Redirection après 2s
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-gray-500 hover:underline"
      >
        ← Retour au dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Lier un enfant</h1>
      <p className="mt-2 text-sm text-gray-600">
        Saisis le code à 6 caractères que ton enfant t&apos;a communiqué. Le
        code est valable 15 minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-800">
            Code d&apos;appairage
          </label>
          <input
            id="code"
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/\s/g, "")
                  .slice(0, 6)
              )
            }
            placeholder="ABC234"
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-2xl font-mono tracking-widest focus:border-amber-500 focus:outline-none"
            disabled={submitting || !!success}
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Lié avec {success.displayName ?? "ton enfant"} ({success.level}) ✓
            <br />
            Redirection vers le dashboard…
          </p>
        )}

        <button
          type="submit"
          disabled={code.length !== 6 || submitting || !!success}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Vérification…" : "Confirmer le lien"}
        </button>
      </form>
    </main>
  );
}
