// src/app/api/auth/pair-parent/route.ts

/**
 * DÉPRÉCIÉ — cette route est remplacée par /api/parent/link.
 *
 * POST /api/parent/link { action: "confirm", code: "ABC234" } (parent)
 * POST /api/parent/link { action: "generate" }                (élève)
 *
 * On garde le fichier pour éviter un 404 si un ancien client appelle
 * cette URL, mais on retourne un redirect vers la bonne route.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Cette route est déplacée vers /api/parent/link.',
      code: 'DEPRECATED',
      redirect: '/api/parent/link',
    },
    { status: 301 }
  );
}
