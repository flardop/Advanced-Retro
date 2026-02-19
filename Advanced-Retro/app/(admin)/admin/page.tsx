import AdminPanel from '@/components/sections/AdminPanel';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function userNameFromAuth(user: any): string {
  const metadataName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim().slice(0, 80);
  }

  const email = typeof user?.email === 'string' ? user.email : '';
  if (email.includes('@')) {
    return email.split('@')[0].slice(0, 80);
  }

  return 'Coleccionista';
}

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
      name: userNameFromAuth(user),
    },
    { onConflict: 'id' }
  );

  await supabaseAdmin
    .from('users')
    .update({
      name: userNameFromAuth(user),
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
