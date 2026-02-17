import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type ListingStatus = 'pending_review' | 'approved' | 'rejected';

export type CreateListingInput = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  originality_status: 'original_verificado' | 'original_sin_verificar' | 'repro_1_1' | 'mixto';
  originality_notes?: string;
  images: string[];
};

const ALLOWED_CATEGORIES = new Set([
  'juegos-gameboy',
  'cajas-gameboy',
  'accesorios',
  'cajas-misteriosas',
]);

const ALLOWED_CONDITIONS = new Set(['new', 'used', 'restored']);
const ALLOWED_ORIGINALITY = new Set([
  'original_verificado',
  'original_sin_verificar',
  'repro_1_1',
  'mixto',
]);

function isValidUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  return /^https?:\/\/.+/i.test(url);
}

function normalizeImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(
    raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && isValidUrl(item))
  )];
}

export function validateListingInput(input: any): CreateListingInput {
  const title = String(input?.title || '').trim().slice(0, 140);
  const description = String(input?.description || '').trim().slice(0, 3000);
  const price = Math.round(Number(input?.price || 0));
  const category = String(input?.category || 'juegos-gameboy').trim();
  const condition = String(input?.condition || 'used').trim();
  const originalityStatus = String(input?.originality_status || '').trim() as CreateListingInput['originality_status'];
  const originalityNotes = String(input?.originality_notes || '').trim().slice(0, 1500);
  const images = normalizeImages(input?.images);

  if (title.length < 6) throw new Error('El titulo debe tener al menos 6 caracteres');
  if (description.length < 40) throw new Error('La descripcion debe tener al menos 40 caracteres');
  if (!Number.isInteger(price) || price < 100) throw new Error('El precio debe ser valido (min 1,00 €)');
  if (!ALLOWED_CATEGORIES.has(category)) throw new Error('Categoria no valida');
  if (!ALLOWED_CONDITIONS.has(condition)) throw new Error('Estado no valido');
  if (!ALLOWED_ORIGINALITY.has(originalityStatus)) throw new Error('Indica la originalidad del producto');
  if (images.length < 2) throw new Error('Debes subir al menos 2 imagenes');
  if (originalityNotes.length < 10) throw new Error('Explica la autenticidad (min 10 caracteres)');

  return {
    title,
    description,
    price,
    category,
    condition,
    originality_status: originalityStatus,
    originality_notes: originalityNotes,
    images,
  };
}

export async function createUserListing(userId: string, payload: CreateListingInput) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .insert({
      user_id: userId,
      ...payload,
      status: 'pending_review',
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'No se pudo crear la publicacion');
  return data;
}

export async function getUserListings(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAdminListings() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await supabaseAdmin.from('users').select('id,email,name').in('id', userIds)
    : { data: [] as any[] };

  const userMap = new Map<string, any>((users || []).map((user) => [user.id, user]));

  return (data || []).map((listing) => ({
    ...listing,
    user: userMap.get(listing.user_id) || null,
  }));
}

export async function updateListingStatus(options: {
  listingId: string;
  status: ListingStatus;
  adminId: string;
  adminNotes?: string;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const nowIso = new Date().toISOString();
  const safeStatus: ListingStatus = ['approved', 'rejected', 'pending_review'].includes(options.status)
    ? options.status
    : 'pending_review';

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .update({
      status: safeStatus,
      reviewed_by: options.adminId,
      admin_notes: String(options.adminNotes || '').trim().slice(0, 1500) || null,
      updated_at: nowIso,
    })
    .eq('id', options.listingId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'No se pudo actualizar la publicacion');
  return data;
}
