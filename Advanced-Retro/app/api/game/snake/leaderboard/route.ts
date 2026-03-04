import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type LeaderboardRow = {
  display_name: string;
  best_score: number;
  games_played: number;
  updated_at: string;
};

function isMissingScoresTableError(message: string): boolean {
  const text = String(message || '').toLowerCase();
  return text.includes('snake_404_scores') && (text.includes('does not exist') || text.includes('not found'));
}

async function getOptionalAuthUser(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token || !supabaseAdmin) return null;

  const authRes = await supabaseAdmin.auth.getUser(token);
  if (authRes.error || !authRes.data?.user) return null;
  return authRes.data.user;
}

function sanitizeScore(input: unknown): number {
  const value = Number(input);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(99999, Math.floor(value)));
}

function buildGuestDisplayName(email: string | null | undefined): string {
  const safeEmail = String(email || '').trim();
  if (!safeEmail.includes('@')) return 'Coleccionista';
  return safeEmail.split('@')[0].slice(0, 40) || 'Coleccionista';
}

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ leaderboard: [], isAuthenticated: false, note: 'Supabase no configurado' });
  }

  const user = await getOptionalAuthUser(req);

  const { data, error } = await supabaseAdmin
    .from('snake_404_scores')
    .select('display_name,best_score,games_played,updated_at')
    .order('best_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(12);

  if (error) {
    if (isMissingScoresTableError(error.message)) {
      return NextResponse.json({
        leaderboard: [],
        isAuthenticated: Boolean(user),
        note: 'Falta tabla snake_404_scores. Ejecuta database/snake_404_leaderboard.sql',
      });
    }
    return NextResponse.json(
      { leaderboard: [], isAuthenticated: Boolean(user), error: error.message },
      { status: 500 }
    );
  }

  let currentUserBest: number | null = null;
  if (user) {
    const own = await supabaseAdmin
      .from('snake_404_scores')
      .select('best_score')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!own.error && own.data && Number.isFinite(Number(own.data.best_score))) {
      currentUserBest = Number(own.data.best_score);
    }
  }

  return NextResponse.json({
    leaderboard: Array.isArray(data) ? (data as LeaderboardRow[]) : [],
    isAuthenticated: Boolean(user),
    currentUserBest,
  });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  const user = await getOptionalAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para guardar tu score.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const score = sanitizeScore((body as any)?.score);
  if (score <= 0) {
    return NextResponse.json({ ok: true, saved: false, reason: 'Score no válido' });
  }

  const profileRes = await supabaseAdmin.from('users').select('name').eq('id', user.id).maybeSingle();
  const displayName =
    String(profileRes.data?.name || '').trim().slice(0, 60) ||
    String(user.user_metadata?.name || user.user_metadata?.full_name || '').trim().slice(0, 60) ||
    buildGuestDisplayName(user.email);

  const existingRes = await supabaseAdmin
    .from('snake_404_scores')
    .select('best_score,games_played')
    .eq('user_id', user.id)
    .maybeSingle();

  const existingBest = Number(existingRes.data?.best_score || 0);
  const existingGamesPlayed = Number(existingRes.data?.games_played || 0);
  const bestScore = Math.max(existingBest, score);
  const gamesPlayed = Math.max(0, existingGamesPlayed) + 1;
  const newPersonalBest = score > existingBest;

  const upsertPayload = {
    user_id: user.id,
    display_name: displayName,
    best_score: bestScore,
    last_score: score,
    games_played: gamesPlayed,
    updated_at: new Date().toISOString(),
  };

  const upsertRes = await supabaseAdmin
    .from('snake_404_scores')
    .upsert(upsertPayload, { onConflict: 'user_id' });

  if (upsertRes.error) {
    if (isMissingScoresTableError(upsertRes.error.message)) {
      return NextResponse.json(
        { error: 'Falta tabla snake_404_scores. Ejecuta database/snake_404_leaderboard.sql' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: upsertRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    score,
    bestScore,
    gamesPlayed,
    newPersonalBest,
  });
}
