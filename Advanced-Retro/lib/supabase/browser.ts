'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PERSISTENT_SESSION_MAX_AGE,
  SUPABASE_AUTH_STORAGE_KEY,
} from '@/lib/supabase/config';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
      },
      cookieOptions: {
        name: SUPABASE_AUTH_STORAGE_KEY,
        path: '/',
        sameSite: 'lax',
        maxAge: PERSISTENT_SESSION_MAX_AGE,
        secure:
          process.env.NODE_ENV === 'production' ||
          process.env.VERCEL_ENV === 'production',
      },
    });
  }

  return browserClient;
}
