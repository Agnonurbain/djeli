// src/app/api/health/route.ts

/**
 * Health check route — utilisée par les sondes de monitoring
 * (Netlify, Uptime Robot, GitHub Actions, etc.).
 *
 * Vérifie :
 *   - L'app répond (la requête arrive jusqu'ici)
 *   - La DB Supabase est joignable (count rapide sur curriculum_content)
 *
 * Ne nécessite pas d'authentification — c'est volontaire pour permettre
 * le monitoring externe. Aucune donnée sensible n'est exposée.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Check DB
  try {
    const dbStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase
      .from('curriculum_content')
      .select('id', { count: 'exact', head: true });

    if (error) {
      checks.db = { ok: false, error: error.message };
    } else {
      checks.db = { ok: true, latencyMs: Date.now() - dbStart };
    }
  } catch (err) {
    checks.db = {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: Math.round(process.uptime()),
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
