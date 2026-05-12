import { getSupabaseServerClient } from '@/lib/supabase/server';

export const supabaseServer = () => getSupabaseServerClient();
