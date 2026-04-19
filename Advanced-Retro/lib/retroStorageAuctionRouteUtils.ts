import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ApiError } from '@/lib/serverAuth';

export async function getOptionalAuctionRouteUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function guessAuctionAuthorName(user: any, profile: any): string {
  const candidates = [
    typeof profile?.name === 'string' ? profile.name : '',
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
    typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : '',
    typeof user?.email === 'string' ? user.email.split('@')[0] : '',
  ];

  for (const entry of candidates) {
    const safe = String(entry || '').trim();
    if (safe) return safe.slice(0, 60);
  }

  return 'Coleccionista';
}

export function auctionBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function handleAuctionRouteError(error: any, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = String(error?.message || fallbackMessage);
  const lowered = message.toLowerCase();
  const status =
    lowered.includes('unauthorized') || lowered.includes('no autorizado')
      ? 401
      : lowered.includes('no existe')
        ? 404
        : lowered.includes('minima') || lowered.includes('payload') || lowered.includes('vacio')
          ? 400
          : 500;

  return NextResponse.json({ error: message || fallbackMessage }, { status });
}
