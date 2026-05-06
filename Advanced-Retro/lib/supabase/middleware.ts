import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

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
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        request.cookies.set(name, value);
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        request.cookies.set(name, '');
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
