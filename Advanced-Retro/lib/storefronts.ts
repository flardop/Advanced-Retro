import { cookies } from 'next/headers';
import type { CSSProperties } from 'react';
import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { MembershipTier } from '@/lib/membership';

export const STOREFRONT_PREVIEW_COOKIE = 'advanced-retro-store-preview';

export type StoreThemeKey =
  | 'retro-dark'
  | 'minimal'
  | 'colorful'
  | 'vintage'
  | 'futuristic'
  | 'pastel';

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type StorefrontRecord = {
  id: string;
  slug: string;
  ownerId?: string | null;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  theme: StoreThemeKey;
  primaryColor: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  state: 'active' | 'paused' | 'review';
  productLimit: number | null;
  membershipTier: MembershipTier;
  createdAt: string;
  views: number;
  products: StorefrontProduct[];
  official?: boolean;
};

export const STOREFRONT_THEME_PRESETS: Record<StoreThemeKey, {
  name: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
}> = {
  'retro-dark': {
    name: 'Retro oscuro',
    background: 'radial-gradient(circle at top, rgba(77, 86, 255, 0.18), transparent 30%), linear-gradient(180deg, #090c16 0%, #0d1324 100%)',
    surface: 'rgba(11, 18, 33, 0.84)',
    border: 'rgba(121, 164, 255, 0.2)',
    text: '#f3f7ff',
    muted: '#9faecc',
    accent: '#66c0f4',
  },
  minimal: {
    name: 'Limpio y minimalista',
    background: 'linear-gradient(180deg, #f7f4ef 0%, #efe8dc 100%)',
    surface: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(92, 74, 53, 0.14)',
    text: '#1d1b17',
    muted: '#6b655e',
    accent: '#5d4530',
  },
  colorful: {
    name: 'Colorido y enérgico',
    background: 'radial-gradient(circle at top left, rgba(255, 80, 154, 0.2), transparent 32%), linear-gradient(135deg, #0f1229 0%, #17183b 100%)',
    surface: 'rgba(18, 21, 47, 0.84)',
    border: 'rgba(255, 130, 188, 0.24)',
    text: '#f8fbff',
    muted: '#b9c3e3',
    accent: '#ff69c9',
  },
  vintage: {
    name: 'Vintage analógico',
    background: 'linear-gradient(180deg, #241a16 0%, #140f0d 100%)',
    surface: 'rgba(48, 32, 24, 0.82)',
    border: 'rgba(219, 178, 117, 0.18)',
    text: '#fff2de',
    muted: '#d0b797',
    accent: '#d69a55',
  },
  futuristic: {
    name: 'Futurista / tech',
    background: 'radial-gradient(circle at top, rgba(0, 255, 194, 0.18), transparent 34%), linear-gradient(180deg, #04070c 0%, #09111d 100%)',
    surface: 'rgba(7, 15, 26, 0.88)',
    border: 'rgba(36, 250, 222, 0.18)',
    text: '#edffff',
    muted: '#90b0b9',
    accent: '#1ef2ff',
  },
  pastel: {
    name: 'Pastel y suave',
    background: 'linear-gradient(180deg, #f8eef8 0%, #eceffc 100%)',
    surface: 'rgba(255, 255, 255, 0.84)',
    border: 'rgba(182, 155, 213, 0.18)',
    text: '#2d2840',
    muted: '#726a8d',
    accent: '#bc8cff',
  },
};

export const DIRECTORY_STORES: StorefrontRecord[] = [
  {
    id: 'official-advancedretro',
    slug: 'advancedretro-oficial',
    name: 'AdvancedRetro',
    shortDescription: 'La tienda oficial del ecosistema. Catálogo curado, drops, subastas y mystery boxes.',
    longDescription:
      'AdvancedRetro es la tienda oficial del ecosistema. Aquí vive el catálogo principal, la experiencia de compra verificada y el punto de entrada para comunidad, subastas, ruleta y proyectos narrativos.',
    category: 'Videojuegos retro y coleccionables',
    theme: 'retro-dark',
    primaryColor: '#66c0f4',
    contactEmail: 'support@advancedretro.es',
    instagram: 'advancedretro.es',
    twitter: 'advancedretro_es',
    state: 'active',
    productLimit: null,
    membershipTier: 'vip',
    createdAt: '2024-01-01T00:00:00.000Z',
    views: 18240,
    official: true,
    products: [
      {
        id: 'official-1',
        name: 'Mystery Box Premium',
        description: 'Selección curada con perfil premium dentro del ecosistema official.',
        price: 39.99,
        image: '/images/mystery/mystery-premium.webp',
      },
      {
        id: 'official-2',
        name: 'Subastas Retro Storage',
        description: 'Lotes verificados, narrativa y bidding con identidad propia.',
        price: 0,
        image: '/images/retroville/nox-styleguide.png',
      },
    ],
  },
  {
    id: 'store-kitsune',
    slug: 'kitsune-cartridges',
    name: 'Kitsune Cartridges',
    shortDescription: 'Cartuchos, inserts y ediciones sueltas seleccionadas para Game Boy y GBA.',
    longDescription:
      'Una tienda pequeña para coleccionistas que valoran piezas sueltas bien descritas, inserts difíciles y ediciones que completan colección sin ruido visual.',
    category: 'Cartuchos y componentes',
    theme: 'retro-dark',
    primaryColor: '#7b7fff',
    instagram: 'kitsune.cartridges',
    state: 'active',
    productLimit: 10,
    membershipTier: 'collector',
    createdAt: '2026-04-18T09:30:00.000Z',
    views: 840,
    products: [
      {
        id: 'kitsune-1',
        name: 'Shantae insert set',
        description: 'Insert y tray para completar edición con presentación impecable.',
        price: 18.5,
        image: '/images/mystery/mystery-standard.webp',
      },
    ],
  },
  {
    id: 'store-neon',
    slug: 'neon-memory-club',
    name: 'Neon Memory Club',
    shortDescription: 'Merch, prints y accesorios para quien vive el retro como cultura visual.',
    longDescription:
      'Un escaparate híbrido entre tienda y estudio visual: accesorios, prints y drops editoriales para la parte más estética del coleccionismo gaming.',
    category: 'Arte y accesorios',
    theme: 'colorful',
    primaryColor: '#ff69c9',
    instagram: 'neonmemory.club',
    state: 'active',
    productLimit: null,
    membershipTier: 'vip',
    createdAt: '2026-05-02T13:00:00.000Z',
    views: 1260,
    products: [
      {
        id: 'neon-1',
        name: 'Retro city print',
        description: 'Print editorial con estética neon dystopia y cultura arcade.',
        price: 24.9,
        image: '/images/retroville/button-crew-styleguide.png',
      },
    ],
  },
];

export function normalizeStoreTheme(value: unknown): StoreThemeKey {
  const safe = String(value || '').trim().toLowerCase();
  if (safe === 'minimal') return 'minimal';
  if (safe === 'colorful') return 'colorful';
  if (safe === 'vintage') return 'vintage';
  if (safe === 'futuristic') return 'futuristic';
  if (safe === 'pastel') return 'pastel';
  return 'retro-dark';
}

export function slugifyStoreName(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 36);
}

export function sanitizeHexColor(value: string) {
  const safe = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(safe)) return safe;
  if (/^#[0-9a-fA-F]{3}$/.test(safe)) {
    const [r, g, b] = safe.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#66c0f4';
}

export function findSampleStorefront(slug: string) {
  const safeSlug = String(slug || '').trim().toLowerCase();
  return DIRECTORY_STORES.find((store) => store.slug === safeSlug) || null;
}

export function encodePreviewStorefront(store: StorefrontRecord) {
  return Buffer.from(JSON.stringify(store), 'utf8').toString('base64url');
}

export function decodePreviewStorefront(rawValue: string | undefined | null): StorefrontRecord | null {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(Buffer.from(rawValue, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as StorefrontRecord;
  } catch {
    return null;
  }
}

export function getPreviewStorefrontFromCookies() {
  const cookieStore = cookies();
  return decodePreviewStorefront(cookieStore.get(STOREFRONT_PREVIEW_COOKIE)?.value);
}

export function buildStorefrontPreviewRecord(input: {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  theme: StoreThemeKey;
  primaryColor: string;
  contactEmail?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  ownerId?: string | null;
  membershipTier: MembershipTier;
}): StorefrontRecord {
  return {
    id: `preview-${input.slug}`,
    slug: input.slug,
    ownerId: input.ownerId || null,
    name: input.name,
    shortDescription: input.shortDescription,
    longDescription: input.longDescription,
    category: input.category,
    theme: input.theme,
    primaryColor: sanitizeHexColor(input.primaryColor),
    contactEmail: input.contactEmail || null,
    instagram: input.instagram || null,
    twitter: input.twitter || null,
    state: 'review',
    productLimit: input.membershipTier === 'collector' ? 10 : null,
    membershipTier: input.membershipTier,
    createdAt: new Date().toISOString(),
    views: 0,
    products: [],
  };
}

export async function getStoredStorefrontBySlug(slug: string): Promise<StorefrontRecord | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('creator_stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;

    const store = data as Record<string, any>;
    return {
      id: String(store.id || `store-${slug}`),
      slug: String(store.slug || slug),
      ownerId: typeof store.user_id === 'string' ? store.user_id : null,
      name: String(store.name || 'Mi tienda'),
      shortDescription: String(store.short_description || ''),
      longDescription: String(store.long_description || ''),
      category: String(store.category || 'Coleccionables'),
      theme: normalizeStoreTheme(store.theme),
      primaryColor: sanitizeHexColor(String(store.primary_color || '#66c0f4')),
      contactEmail: typeof store.contact_email === 'string' ? store.contact_email : null,
      instagram: typeof store.instagram === 'string' ? store.instagram : null,
      twitter: typeof store.twitter === 'string' ? store.twitter : null,
      state: ['active', 'paused', 'review'].includes(String(store.state || 'review'))
        ? (store.state as 'active' | 'paused' | 'review')
        : 'review',
      productLimit: typeof store.product_limit === 'number' ? store.product_limit : null,
      membershipTier: store.membership_tier === 'vip' ? 'vip' : store.membership_tier === 'collector' ? 'collector' : 'explorer',
      createdAt: typeof store.created_at === 'string' ? store.created_at : new Date().toISOString(),
      views: Number(store.views || 0),
      products: Array.isArray(store.products) ? store.products : [],
    };
  } catch {
    return null;
  }
}

export async function getStoredStorefrontByUserId(userId: string): Promise<StorefrontRecord | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('creator_stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: String((data as any).id || `store-${userId}`),
      slug: String((data as any).slug || userId),
      ownerId: typeof (data as any).user_id === 'string' ? (data as any).user_id : userId,
      name: String((data as any).name || 'Mi tienda'),
      shortDescription: String((data as any).short_description || ''),
      longDescription: String((data as any).long_description || ''),
      category: String((data as any).category || 'Coleccionables'),
      theme: normalizeStoreTheme((data as any).theme),
      primaryColor: sanitizeHexColor(String((data as any).primary_color || '#66c0f4')),
      contactEmail:
        typeof (data as any).contact_email === 'string' ? (data as any).contact_email : null,
      instagram: typeof (data as any).instagram === 'string' ? (data as any).instagram : null,
      twitter: typeof (data as any).twitter === 'string' ? (data as any).twitter : null,
      state: ['active', 'paused', 'review'].includes(String((data as any).state || 'review'))
        ? ((data as any).state as 'active' | 'paused' | 'review')
        : 'review',
      productLimit: typeof (data as any).product_limit === 'number' ? (data as any).product_limit : null,
      membershipTier:
        (data as any).membership_tier === 'vip'
          ? 'vip'
          : (data as any).membership_tier === 'collector'
            ? 'collector'
            : 'explorer',
      createdAt:
        typeof (data as any).created_at === 'string'
          ? (data as any).created_at
          : new Date().toISOString(),
      views: Number((data as any).views || 0),
      products: Array.isArray((data as any).products) ? (data as any).products : [],
    };
  } catch {
    return null;
  }
}

export async function slugIsTaken(slug: string) {
  const safe = String(slug || '').trim().toLowerCase();
  if (!safe) return false;
  if (findSampleStorefront(safe)) return true;
  const stored = await getStoredStorefrontBySlug(safe);
  return Boolean(stored);
}

export function buildStoreThemeStyle(store: StorefrontRecord) {
  const preset = STOREFRONT_THEME_PRESETS[store.theme] || STOREFRONT_THEME_PRESETS['retro-dark'];
  return {
    '--store-bg': preset.background,
    '--store-surface': preset.surface,
    '--store-border': preset.border,
    '--store-text': preset.text,
    '--store-muted': preset.muted,
    '--store-accent': sanitizeHexColor(store.primaryColor || preset.accent),
  } as CSSProperties;
}

export function getStorefrontDirectoryJsonLd(stores: StorefrontRecord[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tiendas de la comunidad AdvancedRetro',
    itemListElement: stores.map((store, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: store.name,
      url: absoluteUrl(`/tiendas/${store.slug}`),
      description: store.shortDescription,
    })),
  };
}
