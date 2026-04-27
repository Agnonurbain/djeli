// src/app/(student)/abonnement/retour/page.tsx
"use client";

/**
 * Page de retour après paiement CinetPay.
 *
 * L'utilisateur est redirigé ici par CinetPay après avoir complété
 * (ou annulé) son paiement. On affiche le statut et on redirige
 * vers /tableau au bout de quelques secondes.
 *
 * En mode test, la query ?status=ACCEPTED simule un paiement réussi.
 * Le webhook est envoyé séparément et met à jour la DB côté serveur.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RetourPaiementPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const transactionId = searchParams.get("transaction_id");

  const [webhookSent, setWebhookSent] = useState(false);

  // En mode test : simuler le webhook pour que la DB soit mise à jour
  useEffect(() => {
    if (status === "ACCEPTED" && transactionId && !webhookSent) {
      setWebhookSent(true);
      void fetch("/api/payment/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: transactionId,
          cpm_site_id: "test",
          cpm_amount: "1500",
          cpm_currency: "XOF",
          cpm_payment_method: "test_mobile_money",
          cpm_phone_prefixe: "225",
          cpm_trans_status: "ACCEPTED",
          cpm_trans_date: new Date().toISOString(),
          signature: "test",
        }),
      });
    }
  }, [status, transactionId, webhookSent]);

  const isSuccess = status === "ACCEPTED";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl" aria-hidden>
        {isSuccess ? "✅" : "❌"}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {isSuccess ? "Paiement confirmé !" : "Paiement non finalisé"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-gray-600">
        {isSuccess
          ? "Ton abonnement Premium est activé. Profite de toutes les fonctionnalités de Djeli !"
          : "Le paiement a été annulé ou a échoué. Tu peux réessayer à tout moment."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/tableau"
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-amber-400"
        >
          Aller au Tableau Noir
        </Link>
        {!isSuccess && (
          <Link
            href="/abonnement"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Réessayer
          </Link>
        )}
      </div>
    </main>
  );
}
