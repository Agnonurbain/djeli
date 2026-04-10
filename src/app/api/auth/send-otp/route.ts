// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOtpSchema } from "@/lib/utils/validators";
import { normalizePhone } from "@/lib/utils/format";

/**
 * Envoi OTP via Supabase Auth (qui utilise Twilio Verify en backend).
 * L'utilisateur reçoit un SMS avec un code à 6 chiffres.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation Zod du numéro de téléphone
    const result = sendOtpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0].message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Normalisation du numéro au format international +225XXXXXXXXXX
    const phone = normalizePhone(result.data.phone);

    const supabase = await createClient();

    // Supabase Auth envoie le SMS OTP via le provider Twilio Verify configuré
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      // Rate limit atteint côté Supabase
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
          error: "Impossible d'envoyer le code. Vérifiez votre numéro.",
          code: "OTP_SEND_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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
