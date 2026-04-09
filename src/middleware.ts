// src/middleware.ts

/**
 * Middleware Next.js pour la gestion de l'authentification.
 * Rafraîchit la session Supabase et redirige vers /login si non authentifié.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Appliquer le middleware sur toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - manifest.json, sw.js (fichiers PWA)
     * - Assets publics (images, rive, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|rive/).*)',
  ],
};
