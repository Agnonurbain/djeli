// src/app/(student)/abonnement/page.tsx
"use client";

/**
 * Page d'abonnement — choix entre plan Gratuit et Premium.
 *
 * UX adaptée CI :
 * - Prix en FCFA clairement affiché
 * - Méthode de paiement : Orange Money, MTN MoMo, Wave
 * - En mode test (CinetPay non configuré), le paiement est simulé
 *   et le redirect se fait instantanément vers /abonnement/retour
 */

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/payment/plans";

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money", icon: "🟠" },
  { id: "mtn_momo", label: "MTN MoMo", icon: "🟡" },
  { id: "wave", label: "Wave", icon: "🔵" },
] as const;

const FREE_FEATURES = [
  "3 questions IA par jour",
  "Accès aux cours de base",
  "Arbre de maîtrise",
];

const PREMIUM_FEATURES = [
  "Questions IA illimitées",
  "Tous les exercices",
  "Mode Grin (collaboratif)",
  "Rapports WhatsApp parents",
  "Annales complètes",
];

export default function AbonnementPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>("orange_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "premium",
          paymentMethod: selectedMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Erreur de paiement");
      }
      // Redirection vers la page CinetPay (ou simulation)
      window.location.href = json.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-8">
      <Link href="/tableau" className="text-sm text-gray-500 hover:underline">
        ← Retour
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Abonnement</h1>
      <p className="mt-1 text-sm text-gray-600">
        Choisis le plan qui te convient pour continuer à apprendre avec
        Prof Chibi.
      </p>

      <div className="mt-6 space-y-4">
        {/* Plan Gratuit */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {PLANS.free.name}
            </h2>
            <span className="text-sm font-medium text-gray-500">0 FCFA</span>
          </div>
          <ul className="mt-3 space-y-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-400">—</span> {f}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-400">Plan actuel par défaut</p>
        </div>

        {/* Plan Premium */}
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {PLANS.premium.name}
            </h2>
            <span className="text-lg font-bold text-amber-700">
              {PLANS.premium.priceXOF.toLocaleString("fr-FR")} FCFA
              <span className="text-xs font-normal text-amber-600">/mois</span>
            </span>
          </div>
          <ul className="mt-3 space-y-1">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-800">
                <span className="text-amber-500">✓</span> {f}
              </li>
            ))}
          </ul>

          {/* Choix de la méthode Mobile Money */}
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-gray-800">
              Payer avec
            </legend>
            <div className="mt-2 flex gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                    selectedMethod === m.id
                      ? "border-amber-500 bg-amber-100 text-amber-900"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="block text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleCheckout()}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading
              ? "Redirection vers le paiement…"
              : `Payer ${PLANS.premium.priceXOF.toLocaleString("fr-FR")} FCFA`}
          </button>
        </div>
      </div>
    </main>
  );
}
