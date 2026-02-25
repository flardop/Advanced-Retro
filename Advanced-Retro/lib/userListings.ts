import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type ListingStatus = 'pending_review' | 'approved' | 'rejected';
export type ListingDeliveryStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const COMMUNITY_LISTING_FEE_CENTS = 0;
export const COMMUNITY_COMMISSION_RATE = 10;

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
  'juegos-gameboy-color',
  'juegos-gameboy-advance',
  'juegos-super-nintendo',
  'juegos-gamecube',
  'cajas-gameboy',
  'manuales',
  'accesorios',
  'consolas-retro',
]);

const ALLOWED_CONDITIONS = new Set(['new', 'used', 'restored']);
const ALLOWED_ORIGINALITY = new Set([
  'original_verificado',
  'original_sin_verificar',
  'repro_1_1',
  'mixto',
]);
const ALLOWED_DELIVERY_STATUSES = new Set<ListingDeliveryStatus>([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

function isValidUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  return /^https?:\/\/.+/i.test(url);
}

function normalizeImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && isValidUrl(item))
    ),
  ];
}

function isMissingColumnError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

function withCommunityDefaults<T extends Record<string, any>>(listing: T): T & {
  listing_fee_cents: number;
  commission_rate: number;
  commission_cents: number;
  delivery_status: ListingDeliveryStatus;
} {
  const price = Math.max(0, Number(listing?.price || 0));
  const commissionRateRaw = Number(listing?.commission_rate);
  const commissionRate = Number.isFinite(commissionRateRaw) && commissionRateRaw > 0
    ? commissionRateRaw
    : COMMUNITY_COMMISSION_RATE;

  const commissionRaw = Number(listing?.commission_cents);
  const commissionCents = Number.isFinite(commissionRaw) && commissionRaw >= 0
    ? commissionRaw
    : Math.round((price * commissionRate) / 100);

  const listingFeeRaw = Number(listing?.listing_fee_cents);
  const listingFeeCents = Number.isFinite(listingFeeRaw) && listingFeeRaw >= 0
    ? listingFeeRaw
    : COMMUNITY_LISTING_FEE_CENTS;

  const deliveryStatus = ALLOWED_DELIVERY_STATUSES.has(listing?.delivery_status)
    ? listing.delivery_status
    : 'pending';

  return {
    ...listing,
    listing_fee_cents: listingFeeCents,
    commission_rate: commissionRate,
    commission_cents: commissionCents,
    delivery_status: deliveryStatus,
  };
}

export function calculateCommunityCommissionCents(priceCents: number): number {
  const normalizedPrice = Math.max(0, Math.round(Number(priceCents || 0)));
  return Math.round((normalizedPrice * COMMUNITY_COMMISSION_RATE) / 100);
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
  if (!Number.isInteger(price) || price < 100) throw new Error('El precio debe ser valido (min 1,00 EUR)');
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
  const commissionCents = calculateCommunityCommissionCents(payload.price);

  const extendedInsert = {
    user_id: userId,
    ...payload,
    status: 'pending_review',
    listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
    commission_rate: COMMUNITY_COMMISSION_RATE,
    commission_cents: commissionCents,
    delivery_status: 'pending',
    updated_at: nowIso,
  };

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .insert(extendedInsert)
    .select('*')
    .single();

  if (error && isMissingColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('user_product_listings')
      .insert({
        user_id: userId,
        ...payload,
        status: 'pending_review',
        updated_at: nowIso,
      })
      .select('*')
      .single();

    if (fallbackError || !fallbackData) {
      throw new Error(fallbackError?.message || 'No se pudo crear la publicacion');
    }
    return withCommunityDefaults(fallbackData);
  }

  if (error || !data) throw new Error(error?.message || 'No se pudo crear la publicacion');
  return withCommunityDefaults(data);
}

export async function getUserListings(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((listing) => withCommunityDefaults(listing));
}

export async function getAdminListings() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((listing) => withCommunityDefaults(listing));
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await supabaseAdmin.from('users').select('id,email,name,avatar_url').in('id', userIds)
    : { data: [] as any[] };

  const userMap = new Map<string, any>((users || []).map((user) => [user.id, user]));

  return rows.map((listing) => ({
    ...listing,
    user: userMap.get(listing.user_id) || null,
  }));
}

export async function getPublicApprovedListings(limit = 60) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const safeLimit = Math.min(Math.max(Number(limit || 0), 1), 120);

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((listing) => withCommunityDefaults(listing));
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await supabaseAdmin.from('users').select('id,name,avatar_url').in('id', userIds)
    : { data: [] as any[] };
  const userMap = new Map<string, any>((users || []).map((user) => [String(user.id), user]));

  return rows.map((listing) => ({
    ...listing,
    user: userMap.get(String(listing.user_id)) || null,
  }));
}

export async function getListingById(listingId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error || !data) throw new Error(error?.message || 'Publicacion no encontrada');
  return withCommunityDefaults(data);
}

export async function getPublicSellerProfileByUserId(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const safeUserId = String(userId || '').trim();
  if (!safeUserId) throw new Error('Seller id required');

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select(
      'id,name,avatar_url,banner_url,bio,tagline,favorite_console,profile_theme,badges,is_verified_seller,created_at'
    )
    .eq('id', safeUserId)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error('Vendedor no encontrado');

  const { data: listings, error: listingsError } = await supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .eq('user_id', safeUserId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200);

  if (listingsError) throw new Error(listingsError.message);

  const normalizedListings = (listings || []).map((listing) => withCommunityDefaults(listing));
  const deliveredCount = normalizedListings.filter(
    (listing) => String(listing.delivery_status || '') === 'delivered'
  ).length;
  const activeCount = normalizedListings.filter((listing) =>
    ['pending', 'processing', 'shipped'].includes(String(listing.delivery_status || 'pending'))
  ).length;
  const avgPriceCents =
    normalizedListings.length > 0
      ? Math.round(
          normalizedListings.reduce((sum, listing) => sum + Math.max(0, Number(listing.price || 0)), 0) /
            normalizedListings.length
        )
      : 0;

  const categories = [...new Set(normalizedListings.map((listing) => String(listing.category || '')).filter(Boolean))];

  return {
    seller: {
      id: String(user.id),
      name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Coleccionista',
      avatar_url: typeof user.avatar_url === 'string' ? user.avatar_url : null,
      banner_url: typeof user.banner_url === 'string' ? user.banner_url : null,
      bio: typeof user.bio === 'string' ? user.bio : null,
      tagline: typeof user.tagline === 'string' ? user.tagline : null,
      favorite_console: typeof user.favorite_console === 'string' ? user.favorite_console : null,
      profile_theme: typeof user.profile_theme === 'string' ? user.profile_theme : 'neon-grid',
      badges: Array.isArray(user.badges)
        ? user.badges.filter((value: unknown): value is string => typeof value === 'string')
        : [],
      is_verified_seller: Boolean(user.is_verified_seller),
      created_at: typeof user.created_at === 'string' ? user.created_at : null,
    },
    stats: {
      approved_listings: normalizedListings.length,
      active_listings: activeCount,
      delivered_sales: deliveredCount,
      average_price_cents: avgPriceCents,
      categories,
    },
    listings: normalizedListings,
  };
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

  const previous = await getListingById(options.listingId);
  const commissionCents = calculateCommunityCommissionCents(Number(previous.price || 0));

  const fullUpdatePayload: Record<string, unknown> = {
    status: safeStatus,
    reviewed_by: options.adminId,
    admin_notes: String(options.adminNotes || '').trim().slice(0, 1500) || null,
    updated_at: nowIso,
    listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
    commission_rate: COMMUNITY_COMMISSION_RATE,
    commission_cents: commissionCents,
    approved_at: safeStatus === 'approved' ? nowIso : null,
  };

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .update(fullUpdatePayload)
    .eq('id', options.listingId)
    .select('*')
    .single();

  if (error && isMissingColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
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

    if (fallbackError || !fallbackData) {
      throw new Error(fallbackError?.message || 'No se pudo actualizar la publicacion');
    }

    return withCommunityDefaults(fallbackData);
  }

  if (error || !data) throw new Error(error?.message || 'No se pudo actualizar la publicacion');
  return withCommunityDefaults(data);
}

export async function updateCommunityListingDelivery(options: {
  listingId: string;
  adminId: string;
  buyerEmail?: string;
  deliveryStatus?: ListingDeliveryStatus;
  trackingCode?: string;
  shippingCarrier?: string;
  shippingNotes?: string;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const nextStatus = String(options.deliveryStatus || '').trim() as ListingDeliveryStatus;
  if (nextStatus && !ALLOWED_DELIVERY_STATUSES.has(nextStatus)) {
    throw new Error('Estado de entrega no valido');
  }

  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    reviewed_by: options.adminId,
    updated_at: nowIso,
  };

  if (typeof options.buyerEmail === 'string') {
    const email = options.buyerEmail.trim().toLowerCase();
    payload.buyer_email = email.length > 0 ? email.slice(0, 190) : null;
  }
  if (typeof options.trackingCode === 'string') {
    const tracking = options.trackingCode.trim();
    payload.shipping_tracking_code = tracking.length > 0 ? tracking.slice(0, 120) : null;
  }
  if (typeof options.shippingCarrier === 'string') {
    const carrier = options.shippingCarrier.trim();
    payload.shipping_carrier = carrier.length > 0 ? carrier.slice(0, 80) : null;
  }
  if (typeof options.shippingNotes === 'string') {
    const notes = options.shippingNotes.trim();
    payload.shipping_notes = notes.length > 0 ? notes.slice(0, 1500) : null;
  }
  if (nextStatus) {
    payload.delivery_status = nextStatus;
    if (nextStatus === 'delivered') {
      payload.delivered_at = nowIso;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('user_product_listings')
    .update(payload)
    .eq('id', options.listingId)
    .select('*')
    .single();

  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error(
        'Faltan columnas del marketplace comunidad. Ejecuta: database/community_marketplace_upgrade.sql'
      );
    }
    throw new Error(error.message || 'No se pudo actualizar entrega');
  }
  if (!data) throw new Error('No se pudo actualizar entrega');

  return withCommunityDefaults(data);
}
