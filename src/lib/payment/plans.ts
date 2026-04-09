// src/lib/payment/plans.ts

/**
 * Définition des plans d'abonnement Djeli.
 *
 * Gratuit : accès limité (3 interactions IA/jour)
 * Premium : accès illimité (1 500 FCFA/mois via Mobile Money)
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    /** Prix en FCFA (XOF) */
    priceXOF: 0,
    /** Nombre maximum d'interactions IA par jour */
    dailyInteractions: 3,
    /** Accès aux exercices limités */
    exercisesLimited: true,
    /** Pas d'accès au Mode Grin (collaboratif) */
    grinAccess: false,
    /** Pas de rapports parents */
    parentReports: false,
    /** Pas d'annales complètes */
    fullAnnales: false,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    /** Prix mensuel en FCFA (XOF) */
    priceXOF: 1500,
    /** Interactions IA illimitées */
    dailyInteractions: Infinity,
    /** Accès complet aux exercices */
    exercisesLimited: false,
    /** Accès au Mode Grin (collaboratif) */
    grinAccess: true,
    /** Rapports hebdomadaires WhatsApp pour les parents */
    parentReports: true,
    /** Annales complètes disponibles */
    fullAnnales: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];
