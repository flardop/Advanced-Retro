import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import {
  PERSISTENT_SESSION_MAX_AGE,
  SUPABASE_AUTH_STORAGE_KEY,
} from '@/lib/supabase/config';

export function createMiddlewareSupabaseClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars are not configured');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: SUPABASE_AUTH_STORAGE_KEY,
      path: '/',
      sameSite: 'lax',
      maxAge: PERSISTENT_SESSION_MAX_AGE,
      secure:
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production',
    },
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });
}
