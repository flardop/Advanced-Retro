import AdminPanel from '@/components/sections/AdminPanel';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { syncAuthUserProfileRow } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  if (!supabaseAdmin) {
    redirect('/perfil');
  }

  await syncAuthUserProfileRow(user);

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/perfil');
  }

  return <AdminPanel />;
}
