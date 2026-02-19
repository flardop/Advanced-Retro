import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const requireAdmin = async () => {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Unauthorized');
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (userRow?.role !== 'admin') throw new Error('Forbidden');
  return data.user;
};

export async function GET() {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const body = await req.json();

    const legacyProbe = await supabaseAdmin.from('products').select('category').limit(1);
    const isLegacySchema = !legacyProbe.error;

    const payload = isLegacySchema
      ? {
          name: String(body?.name || '').trim(),
          description: String(body?.description || body?.long_description || '').trim(),
          price: Number(body?.price || 0),
          image:
            (Array.isArray(body?.images) && body.images.length > 0 ? body.images[0] : body?.image) || null,
          images: Array.isArray(body?.images)
            ? body.images.filter((value: unknown) => typeof value === 'string' && value.trim())
            : body?.image
              ? [body.image]
              : [],
          category:
            typeof body?.category === 'string' && body.category.trim()
              ? body.category.trim()
              : 'juegos-gameboy',
          stock: Number(body?.stock || 0),
          component_type:
            typeof body?.component_type === 'string' && body.component_type.trim()
              ? body.component_type.trim()
              : 'full_game',
          edition:
            typeof body?.edition === 'string' && body.edition.trim()
              ? body.edition.trim()
              : 'sin-especificar',
          platform:
            typeof body?.platform === 'string' && body.platform.trim()
              ? body.platform.trim()
              : null,
          collection_key:
            typeof body?.collection_key === 'string' && body.collection_key.trim()
              ? body.collection_key.trim()
              : null,
          is_mystery_box:
            Boolean(body?.is_mystery_box) ||
            String(body?.category || '').trim() === 'cajas-misteriosas',
        }
      : body;

    const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
