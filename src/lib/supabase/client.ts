// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Client Supabase pour le navigateur (composants "use client").
 * Utilise les variables publiques NEXT_PUBLIC_*.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
