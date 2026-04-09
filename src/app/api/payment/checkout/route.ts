// src/app/api/payment/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: Implémenter l'initiation de paiement CinetPay
// - Vérifier l'authentification de l'utilisateur
// - Valider le plan d'abonnement et le montant en FCFA avec Zod
// - Créer une transaction dans Supabase (statut: pending)
// - Appeler l'API CinetPay pour initier le paiement Mobile Money
//   (Orange Money, MTN MoMo, Wave)
// - Retourner l'URL de paiement CinetPay ou le token de transaction

/**
 * Initiation paiement CinetPay
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    paymentUrl: "https://checkout.cinetpay.com/placeholder",
    transactionId: "placeholder-transaction-id",
  });
}
