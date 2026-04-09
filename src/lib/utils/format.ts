// src/lib/utils/format.ts

/**
 * Utilitaires de formatage pour le contexte ivoirien.
 */

/**
 * Formate un montant en FCFA (XOF).
 * Exemple : 1500 → "1 500 FCFA"
 *
 * Utilise l'espace insécable comme séparateur de milliers,
 * conformément à la norme française.
 */
export function formatXOF(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} FCFA`;
}

/**
 * Formate un numéro de téléphone ivoirien.
 * Entrée : "0701020304" ou "+2250701020304" ou "2250701020304"
 * Sortie : "+225 07 01 02 03 04"
 *
 * Les numéros ivoiriens ont 10 chiffres après l'indicatif +225.
 */
export function formatPhone(phone: string): string {
  // Nettoyer : garder uniquement les chiffres et le +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Extraire les 10 chiffres du numéro local
  let digits: string;
  if (cleaned.startsWith('+225')) {
    digits = cleaned.slice(4);
  } else if (cleaned.startsWith('225')) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    digits = cleaned;
  } else {
    digits = cleaned;
  }

  // Formater en groupes de 2 chiffres : 07 01 02 03 04
  const groups = digits.match(/.{1,2}/g) ?? [digits];
  return `+225 ${groups.join(' ')}`;
}
