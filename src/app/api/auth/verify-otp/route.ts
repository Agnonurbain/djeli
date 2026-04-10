// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOtpSchema } from "@/lib/utils/validators";
import { normalizePhone } from "@/lib/utils/format";

/**
 * Vérification du code OTP et création de session.
 * Supabase Auth vérifie le code via Twilio Verify, crée/récupère l'utilisateur,
 * et retourne un JWT stocké dans un cookie httpOnly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation Zod du numéro + code
    const result = verifyOtpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0].message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const phone = normalizePhone(result.data.phone);
    const supabase = await createClient();

    // Vérification du code OTP — Supabase crée la session automatiquement
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: result.data.code,
      type: "sms",
    });

    if (error) {
      // Code expiré ou invalide
      if (error.status === 403 || error.message.includes("expired")) {
        return NextResponse.json(
          {
            error: "Code invalide ou expiré. Demandez un nouveau code.",
            code: "OTP_INVALID",
          },
          { status: 403 }
        );
      }

      // Trop de tentatives de vérification
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Trop de tentatives. Réessayez dans quelques minutes.",
            code: "RATE_LIMIT",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Échec de la vérification.",
          code: "VERIFY_FAILED",
        },
        { status: 400 }
      );
    }

    // Déterminer si c'est un nouvel utilisateur (pas encore de profil)
    const isNewUser = !data.user?.user_metadata?.onboarded;

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        phone: data.user?.phone,
        isNewUser,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Erreur interne du serveur.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
