// src/app/api/parent/link/route.ts

/**
 * Gestion des liens parent-élève.
 *
 * GET  : liste les liens de l'utilisateur connecté.
 *        - Si rôle = student : renvoie ses parents liés + le code en attente s'il y en a.
 *        - Si rôle = parent  : renvoie ses enfants liés (confirmed = true).
 *
 * POST { action: "generate" } (student uniquement) :
 *        Génère un pairing_code à 6 caractères valide 15 min.
 *        Remplace tout code précédent non confirmé (le plus simple pour l'UX).
 *
 * POST { action: "confirm", code } (parent uniquement) :
 *        Appelle le RPC claim_parent_link qui vérifie le code et attache
 *        le parent à l'élève. Le RPC est SECURITY DEFINER car RLS empêche
 *        un parent de lire un lien qui ne lui appartient pas encore.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parentLinkActionSchema } from '@/lib/utils/validators';

/** Durée de validité d'un code d'appairage (minutes). */
const PAIRING_TTL_MINUTES = 15;

/** Caractères utilisables dans un pairing_code : majuscules A-Z et chiffres 0-9,
 *  sans I/O/0/1 pour éviter les confusions à la saisie. */
const PAIRING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Génère un code d'appairage cryptographiquement aléatoire de 6 caractères. */
function generatePairingCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += PAIRING_ALPHABET[bytes[i] % PAIRING_ALPHABET.length];
  }
  return code;
}

/**
 * GET /api/parent/link
 * Retourne la vue appropriée selon le rôle :
 *   - student : { role: "student", pendingCode, pendingExpiresAt, parents: [...] }
 *   - parent  : { role: "parent",  children: [...] }
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentification requise.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // Lire le rôle de l'utilisateur (colonne non RLS-protégée, mais on filtre sur id).
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userRow) {
    return NextResponse.json(
      { error: 'Utilisateur introuvable.', code: 'USER_NOT_FOUND' },
      { status: 404 }
    );
  }

  if (userRow.role === 'student') {
    // Code en attente (le plus récent, non confirmé) + liste des parents liés
    const [pendingResult, parentsResult] = await Promise.all([
      // pairing_expires_at ajouté en migration 009 — pas encore dans les types générés
      (supabase
        .from('parent_links')
        .select('pairing_code, pairing_expires_at')
        .eq('student_id', user.id)
        .eq('confirmed', false)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as unknown as Promise<{
          data: { pairing_code: string | null; pairing_expires_at: string | null } | null;
          error: { message: string } | null;
        }>),
      supabase
        .from('parent_links')
        .select('id, parent_id, created_at')
        .eq('student_id', user.id)
        .eq('confirmed', true),
    ]);

    return NextResponse.json({
      role: 'student',
      pendingCode: pendingResult.data?.pairing_code ?? null,
      pendingExpiresAt: pendingResult.data?.pairing_expires_at ?? null,
      parents: parentsResult.data ?? [],
    });
  }

  if (userRow.role === 'parent') {
    // Liens confirmés du parent + profil de chaque enfant
    const { data: links, error: linksError } = await supabase
      .from('parent_links')
      .select('id, student_id, created_at')
      .eq('parent_id', user.id)
      .eq('confirmed', true);

    if (linksError) {
      console.error('[parent/link] read links failed:', linksError);
      return NextResponse.json(
        { error: 'Impossible de charger les liens.', code: 'READ_FAILED' },
        { status: 500 }
      );
    }

    const studentIds = (links ?? []).map((l) => l.student_id).filter(Boolean) as string[];

    let profiles: Array<{
      user_id: string;
      display_name: string | null;
      level: string;
      city: string | null;
      xp: number | null;
      streak_days: number | null;
    }> = [];

    if (studentIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('student_profiles')
        .select('user_id, display_name, level, city, xp, streak_days')
        .in('user_id', studentIds);
      profiles = profileRows ?? [];
    }

    const children = (links ?? []).map((link) => {
      const profile = profiles.find((p) => p.user_id === link.student_id);
      return {
        linkId: link.id,
        studentId: link.student_id,
        linkedAt: link.created_at,
        displayName: profile?.display_name ?? null,
        level: profile?.level ?? null,
        city: profile?.city ?? null,
        xp: profile?.xp ?? 0,
        streakDays: profile?.streak_days ?? 0,
      };
    });

    return NextResponse.json({ role: 'parent', children });
  }

  return NextResponse.json(
    { error: 'Rôle non supporté.', code: 'ROLE_UNSUPPORTED' },
    { status: 403 }
  );
}

/**
 * POST /api/parent/link
 * Body : { action: "generate" } OU { action: "confirm", code: "ABC234" }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentification requise.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parseResult = parentLinkActionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? 'Données invalides.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userRow?.role;

  if (parseResult.data.action === 'generate') {
    if (role !== 'student') {
      return NextResponse.json(
        {
          error: 'Seul un élève peut générer un code d\'appairage.',
          code: 'ROLE_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Invalide tout code précédent non confirmé — un seul actif à la fois
    await supabase
      .from('parent_links')
      .delete()
      .eq('student_id', user.id)
      .eq('confirmed', false)
      .is('parent_id', null);

    const code = generatePairingCode();
    const expiresAt = new Date(
      Date.now() + PAIRING_TTL_MINUTES * 60 * 1000
    ).toISOString();

    // Cast nécessaire tant que les types ne contiennent pas pairing_expires_at (migration 009)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('parent_links') as any).insert({
      student_id: user.id,
      pairing_code: code,
      pairing_expires_at: expiresAt,
      confirmed: false,
      parent_id: null,
    });

    if (insertError) {
      console.error('[parent/link] generate failed:', insertError);
      return NextResponse.json(
        { error: 'Impossible de générer le code.', code: 'GENERATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      ttlMinutes: PAIRING_TTL_MINUTES,
    });
  }

  // action === 'confirm'
  if (role !== 'parent') {
    return NextResponse.json(
      {
        error: 'Seul un parent peut confirmer un code d\'appairage.',
        code: 'ROLE_FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // La fonction RPC n'est pas encore typée dans database.ts (Functions reste
  // à never tant que supabase gen types n'a pas repopulé le cache PostgREST).
  // On cast pour garder le typage strict du reste du fichier.
  type ClaimRpcFn = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{
    data:
      | Array<{
          student_id: string;
          student_display_name: string | null;
          student_level: string;
        }>
      | null;
    error: { message: string } | null;
  }>;
  const rpcCall = supabase.rpc as unknown as ClaimRpcFn;
  const { data: rpcData, error: rpcError } = await rpcCall(
    'claim_parent_link',
    { p_code: parseResult.data.code }
  );

  if (rpcError) {
    // Le RPC lève "Code invalide ou expiré" quand le code n'existe plus
    const isExpected = rpcError.message.includes('Code invalide');
    if (!isExpected) {
      console.error('[parent/link] claim RPC failed:', rpcError);
    }
    return NextResponse.json(
      {
        error: rpcError.message,
        code: isExpected ? 'CODE_INVALID' : 'CLAIM_FAILED',
      },
      { status: isExpected ? 400 : 500 }
    );
  }

  const claimed = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : null;

  return NextResponse.json({
    success: true,
    student: claimed
      ? {
          id: claimed.student_id,
          displayName: claimed.student_display_name,
          level: claimed.student_level,
        }
      : null,
  });
}
