import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.ANON;

export const supabaseClient =
  supabaseUrl && anonKey
    ? createClientComponentClient({
        supabaseUrl,
        supabaseKey: anonKey,
      })
    : null;
