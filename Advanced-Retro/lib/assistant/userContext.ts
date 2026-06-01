import { getFavoriteProductsForUser, type FavoriteProductCard } from '@/lib/profileFavorites';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type AssistantRecentOrder = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string | null;
  trackingCode: string | null;
  shippingMethod: string | null;
  itemNames: string[];
};

export type AssistantOpenTicket = {
  id: string;
  subject: string;
  status: string;
  updatedAt: string | null;
};

export type AssistantUserContext = {
  isLoggedIn: boolean;
  userId: string | null;
  profileName: string | null;
  favoriteProducts: FavoriteProductCard[];
  favoritePlatforms: string[];
  favoriteFranchises: string[];
  recentOrders: AssistantRecentOrder[];
  openTickets: AssistantOpenTicket[];
};

const FRANCHISE_RULES = [
  'pokemon',
  'zelda',
  'mario',
  'kirby',
  'metroid',
  'sonic',
  'donkey kong',
  'final fantasy',
  'resident evil',
  'dragon ball',
  'castlevania'
];

function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function extractFavoriteFranchises(products: FavoriteProductCard[]): string[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const normalized = String(product.name || '').toLowerCase();
    for (const rule of FRANCHISE_RULES) {
      if (normalized.includes(rule)) {
        counts.set(rule, (counts.get(rule) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => capitalizeWords(key))
    .slice(0, 3);
}

function extractFavoritePlatforms(products: FavoriteProductCard[]): string[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const platform = String(product.platform || '').trim();
    if (!platform) continue;
    counts.set(platform, (counts.get(platform) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, 3);
}

function getProfileName(user: any): string | null {
  const candidate = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email;
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  return trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
}

export async function loadAssistantUserContext(): Promise<AssistantUserContext> {
  const fallback: AssistantUserContext = {
    isLoggedIn: false,
    userId: null,
    profileName: null,
    favoriteProducts: [],
    favoritePlatforms: [],
    favoriteFranchises: [],
    recentOrders: [],
    openTickets: [],
  };

  if (!supabaseAdmin) return fallback;

  try {
    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user?.id) return fallback;

    const [favoritesResult, ordersResult, ticketsResult] = await Promise.all([
      getFavoriteProductsForUser(user.id, 36).catch(() => ({ available: false, items: [], total: 0 })),
      supabaseAdmin
        .from('orders')
        .select('id,status,total,created_at,shipping_tracking_code,shipping_method,items')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('support_tickets')
        .select('id,subject,status,updated_at')
        .eq('user_id', user.id)
        .in('status', ['open', 'in_progress'])
        .order('updated_at', { ascending: false })
        .limit(6),
    ]);

    const favoriteProducts = favoritesResult.items || [];
    const recentOrders = !ordersResult.error && Array.isArray(ordersResult.data)
      ? ordersResult.data.map((row: any) => ({
          id: String(row?.id || ''),
          status: String(row?.status || 'pending'),
          totalCents: Math.max(0, Number(row?.total || 0)),
          createdAt: typeof row?.created_at === 'string' ? row.created_at : null,
          trackingCode: typeof row?.shipping_tracking_code === 'string' ? row.shipping_tracking_code : null,
          shippingMethod: typeof row?.shipping_method === 'string' ? row.shipping_method : null,
          itemNames: Array.isArray(row?.items)
            ? row.items
                .map((item: any) => String(item?.name || item?.title || '').trim())
                .filter(Boolean)
                .slice(0, 4)
            : [],
        }))
      : [];

    const openTickets = !ticketsResult.error && Array.isArray(ticketsResult.data)
      ? ticketsResult.data.map((row: any) => ({
          id: String(row?.id || ''),
          subject: String(row?.subject || 'Ticket de soporte'),
          status: String(row?.status || 'open'),
          updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
        }))
      : [];

    return {
      isLoggedIn: true,
      userId: user.id,
      profileName: getProfileName(user),
      favoriteProducts,
      favoritePlatforms: extractFavoritePlatforms(favoriteProducts),
      favoriteFranchises: extractFavoriteFranchises(favoriteProducts),
      recentOrders,
      openTickets,
    };
  } catch {
    return fallback;
  }
}
