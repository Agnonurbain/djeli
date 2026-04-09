// src/types/payment.ts

/**
 * Types pour le système de paiement Mobile Money via CinetPay.
 */

/** Devise utilisée — Franc CFA (XOF) */
export type Currency = 'XOF';

/** Méthodes de paiement Mobile Money disponibles en Côte d'Ivoire */
export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'wave';

/** Statut d'une transaction */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/** Identifiant de plan */
export type PlanId = 'free' | 'premium';

/** Définition d'un plan d'abonnement */
export interface Plan {
  /** Identifiant unique du plan */
  id: PlanId;
  /** Nom affiché */
  name: string;
  /** Prix mensuel en FCFA (XOF) */
  priceXOF: number;
  /** Nombre d'interactions IA par jour (Infinity pour illimité) */
  dailyInteractions: number;
  /** Exercices limités ? */
  exercisesLimited: boolean;
  /** Accès au Mode Grin (collaboratif) */
  grinAccess: boolean;
  /** Rapports WhatsApp parents */
  parentReports: boolean;
  /** Annales complètes */
  fullAnnales: boolean;
}

/** Transaction de paiement */
export interface Transaction {
  /** Identifiant unique */
  id: string;
  /** Identifiant de l'utilisateur */
  userId: string;
  /** Identifiant de transaction CinetPay */
  cinetpayTransactionId: string | null;
  /** Montant en FCFA */
  amount: number;
  /** Devise */
  currency: Currency;
  /** Statut */
  status: TransactionStatus;
  /** Méthode de paiement utilisée */
  paymentMethod: PaymentMethod | null;
  /** Date de création */
  createdAt: Date;
}

/** Payload reçu via le webhook CinetPay */
export interface WebhookPayload {
  /** Identifiant de transaction CinetPay */
  cpm_trans_id: string;
  /** Identifiant du site CinetPay */
  cpm_site_id: string;
  /** Montant payé */
  cpm_amount: string;
  /** Devise */
  cpm_currency: string;
  /** Méthode de paiement */
  cpm_payment_method: string;
  /** Préfixe téléphonique */
  cpm_phone_prefixe: string;
  /** Statut de la transaction */
  cpm_trans_status: string;
  /** Date de la transaction */
  cpm_trans_date: string;
  /** Signature HMAC pour vérification */
  signature: string;
}
