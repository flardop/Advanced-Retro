import AdminPanel from '@/components/sections/AdminPanel';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

  await supabaseAdmin.from('users').upsert(
    {
      id: user.id,
      email: user.email || `${user.id}@local.invalid`,
      role: 'user',
    },
    { onConflict: 'id' }
  );

  await supabaseAdmin
    .from('users')
    .update({
      name:
        typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name.slice(0, 80)
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

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
