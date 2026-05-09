// src/app/api/auth/logout/route.ts

/**
 * Déconnexion : invalide la session Supabase courante côté serveur.
 * Le cookie httpOnly est effacé par Supabase via le middleware.
 *
 * Appelé par un POST depuis le client (formulaire ou fetch). On ne fait
 * pas de redirect côté API : c'est au client de naviguer vers /login.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth/logout] signOut failed:', error);
    return NextResponse.json(
      { error: 'Impossible de te déconnecter.', code: 'LOGOUT_FAILED' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
