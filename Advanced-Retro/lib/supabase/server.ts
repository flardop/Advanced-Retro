import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const PERSISTENT_SESSION_MAX_AGE = 60 * 60 * 24 * 365 * 5;

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars are not configured');
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      maxAge: PERSISTENT_SESSION_MAX_AGE,
      secure:
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production',
    },
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        } catch {
          // Server Components cannot always mutate cookies directly.
          // Middleware handles the refresh path for those requests.
        }
      },
    },
  });
}
