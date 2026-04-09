// src/lib/utils/validators.ts

/**
 * Schémas Zod pour la validation de toutes les entrées API.
 * Chaque route API utilise ces schémas pour valider le body avant traitement.
 */

import { z } from 'zod';

/**
 * Numéro de téléphone ivoirien.
 * Formats acceptés : +225XXXXXXXXXX, 225XXXXXXXXXX, 0XXXXXXXXX
 * Les numéros CI ont 10 chiffres locaux (depuis 2021).
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+?225)?0?\d{10}$/,
    'Numéro de téléphone ivoirien invalide. Format attendu : +225 07 XX XX XX XX'
  );

/**
 * Code OTP à 6 chiffres envoyé par SMS.
 */
export const otpSchema = z
  .string()
  .trim()
  .length(6, 'Le code OTP doit contenir 6 chiffres')
  .regex(/^\d{6}$/, 'Le code OTP ne doit contenir que des chiffres');

/**
 * Message envoyé dans le chat par l'élève.
 */
export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Le message ne peut pas être vide')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères'),
  sessionId: z.string().uuid('Identifiant de session invalide').optional(),
  subject: z.string().max(50).optional(),
  topic: z.string().max(100).optional(),
});

/**
 * Validation de la demande d'envoi d'OTP.
 */
export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

/**
 * Validation de la vérification d'OTP.
 */
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

/**
 * Validation du profil étudiant lors de l'onboarding.
 */
export const studentProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  level: z.enum([
    '6eme', '5eme', '4eme', '3eme',
    '2nde', '1ere', 'tle',
    'l1', 'l2', 'l3', 'm1', 'm2',
  ]),
  school: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
});

/**
 * Validation de l'initiation de paiement.
 */
export const checkoutSchema = z.object({
  planId: z.enum(['free', 'premium']),
  paymentMethod: z.enum(['orange_money', 'mtn_momo', 'wave']).optional(),
});

/**
 * Validation du code d'appairage parent-élève.
 */
export const pairingCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Le code d'appairage doit contenir 6 caractères")
    .regex(/^[A-Z0-9]{6}$/, "Le code d'appairage ne contient que des lettres majuscules et chiffres"),
});
