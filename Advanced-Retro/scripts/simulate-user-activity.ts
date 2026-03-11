/**
 * Simula actividad DEMO durante N minutos para QA visual/carga ligera.
 *
 * Uso:
 *   DEMO_ACTIVITY_I_UNDERSTAND=YES npx tsx scripts/simulate-user-activity.ts --minutes=5 --paceMs=1200
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

type DemoUser = { id: string; email: string; name: string };
type Product = { id: string; name: string; category: string | null; price: number | null; image: string | null; images: string[] | null };

type EnabledTables = {
  likes: boolean;
  visits: boolean;
  reviews: boolean;
  summaries: boolean;
  posts: boolean;
  listings: boolean;
};

const ACK_ENV = 'DEMO_ACTIVITY_I_UNDERSTAND';
const DEMO_DOMAIN = '@advancedretro.local';

function loadEnvLocal() {
  const paths = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '..', '.env.local'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    return;
  }
}

function parseArg(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : fallback;
}

function wait(ms: number) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function tableAvailable(supabase: any, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  if (!error) return true;
  if (/does not exist|schema cache|relation/i.test(error.message || '')) return false;
  throw new Error(`Error comprobando tabla ${table}: ${error.message}`);
}

async function recalcSummary(supabase: any, productId: string) {
  const [likesCountRes, visitsRes, reviewsRes] = await Promise.all([
    supabase.from('product_likes').select('user_id', { count: 'exact', head: true }).eq('product_id', productId),
    supabase.from('product_social_visits').select('visits_count').eq('product_id', productId).limit(2000),
    supabase.from('product_social_reviews').select('rating').eq('product_id', productId).limit(2000),
  ]);

  if (likesCountRes.error) throw new Error(likesCountRes.error.message);
  if (visitsRes.error) throw new Error(visitsRes.error.message);
  if (reviewsRes.error) throw new Error(reviewsRes.error.message);

  const likesCount = Math.max(0, Number(likesCountRes.count || 0));
  const visits = (visitsRes.data || []).reduce(
    (acc: number, row: any) => acc + Math.max(0, Number(row.visits_count || 0)),
    0
  );
  const ratings = (reviewsRes.data || [])
    .map((row: any) => Number(row.rating || 0))
    .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= 5);
  const reviewsCount = ratings.length;
  const ratingAverage = reviewsCount > 0
    ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / reviewsCount).toFixed(2))
    : 0;

  const upsert = await supabase.from('product_social_summary').upsert(
    {
      product_id: productId,
      visits,
      likes_count: likesCount,
      reviews_count: reviewsCount,
      rating_average: ratingAverage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'product_id' }
  );
  if (upsert.error) throw new Error(upsert.error.message);
}

async function main() {
  loadEnvLocal();

  if (process.env[ACK_ENV] !== 'YES') {
    throw new Error(`Protección activa: exporta ${ACK_ENV}=YES para ejecutar simulación DEMO.`);
  }

  const minutes = Math.max(1, Number(parseArg('minutes', '5')));
  const paceMs = Math.max(300, Number(parseArg('paceMs', '1200')));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const usersRes = await supabase
    .from('users')
    .select('id,email,name')
    .ilike('email', `%${DEMO_DOMAIN}`)
    .limit(500);
  if (usersRes.error) throw new Error(usersRes.error.message);

  const users = (usersRes.data || []) as DemoUser[];
  if (users.length === 0) {
    throw new Error(`No hay usuarios DEMO en public.users con dominio ${DEMO_DOMAIN}`);
  }

  const productsRes = await supabase
    .from('products')
    .select('id,name,category,price,image,images,is_mystery_box,stock')
    .gt('stock', 0)
    .eq('is_mystery_box', false)
    .limit(600);
  if (productsRes.error) throw new Error(productsRes.error.message);

  const products = (productsRes.data || []) as (Product & { is_mystery_box?: boolean; stock?: number | null })[];
  if (products.length === 0) throw new Error('No hay productos para simular actividad');

  const enabled: EnabledTables = {
    likes: await tableAvailable(supabase, 'product_likes'),
    visits: await tableAvailable(supabase, 'product_social_visits'),
    reviews: await tableAvailable(supabase, 'product_social_reviews'),
    summaries: await tableAvailable(supabase, 'product_social_summary'),
    posts: await tableAvailable(supabase, 'community_posts'),
    listings: await tableAvailable(supabase, 'user_product_listings'),
  };

  console.log('Tablas activas:', enabled);

  const endAt = Date.now() + minutes * 60 * 1000;
  const touchedProducts = new Set<string>();
  let actions = 0;
  const counters = {
    visits: 0,
    likesAdded: 0,
    likesRemoved: 0,
    reviews: 0,
    posts: 0,
    listings: 0,
    errors: 0,
  };

  while (Date.now() < endAt) {
    const user = pick(users);
    const product = pick(products);
    const productId = String(product.id);
    touchedProducts.add(productId);

    const actionRoll = Math.random();

    try {
      if (actionRoll < 0.35 && enabled.visits) {
        const visitorKey = `auth-${user.id}`;
        const current = await supabase
          .from('product_social_visits')
          .select('visits_count')
          .eq('product_id', productId)
          .eq('visitor_key', visitorKey)
          .maybeSingle();
        if (current.error) throw new Error(current.error.message);

        const nextCount = Math.max(1, Number(current.data?.visits_count || 0) + 1);
        const upsert = await supabase.from('product_social_visits').upsert(
          {
            product_id: productId,
            visitor_key: visitorKey,
            visits_count: nextCount,
            last_visit_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,visitor_key' }
        );
        if (upsert.error) throw new Error(upsert.error.message);
        counters.visits += 1;
      } else if (actionRoll < 0.65 && enabled.likes) {
        const existing = await supabase
          .from('product_likes')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing.error) throw new Error(existing.error.message);

        if (existing.data?.id && Math.random() < 0.35) {
          const del = await supabase
            .from('product_likes')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', user.id);
          if (del.error) throw new Error(del.error.message);
          counters.likesRemoved += 1;
        } else {
          const ins = await supabase
            .from('product_likes')
            .upsert({ product_id: productId, user_id: user.id }, { onConflict: 'product_id,user_id' });
          if (ins.error) throw new Error(ins.error.message);
          counters.likesAdded += 1;
        }
      } else if (actionRoll < 0.86 && enabled.reviews) {
        const rating = Math.random() < 0.85 ? randomInt(4, 5) : 3;
        const comment = `[DEMO TRAFFIC] ${product.name}: estado correcto para ${product.category || 'retro'} y compra segura.`;
        const ins = await supabase.from('product_social_reviews').insert({
          product_id: productId,
          user_id: user.id,
          visitor_key: `auth-${user.id}`,
          author_name: user.name,
          rating,
          comment,
          photos: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (ins.error) throw new Error(ins.error.message);
        counters.reviews += 1;
      } else if (actionRoll < 0.94 && enabled.posts) {
        const imageUrl = Array.isArray(product.images) && product.images.length > 0
          ? String(product.images[0] || '').trim()
          : String(product.image || '').trim();
        const ins = await supabase.from('community_posts').insert({
          id: randomUUID(),
          user_id: user.id,
          title: `[DEMO TRAFFIC] Impresiones sobre ${product.name}`,
          content: `[DEMO TRAFFIC] Probando publicaciones de comunidad para QA. Categoría: ${product.category || 'retro'}.`,
          images: imageUrl ? [imageUrl] : [],
          likes_count: randomInt(0, 3),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (ins.error) throw new Error(ins.error.message);
        counters.posts += 1;
      } else if (enabled.listings) {
        const imageUrl = Array.isArray(product.images) && product.images.length > 0
          ? String(product.images[0] || '').trim()
          : String(product.image || '').trim();
        const price = Math.max(100, Math.round(Number(product.price || 2000) * (0.8 + Math.random() * 0.25)));
        const ins = await supabase.from('user_product_listings').insert({
          id: randomUUID(),
          user_id: user.id,
          title: `[DEMO TRAFFIC] ${product.name}`,
          description: `[DEMO TRAFFIC] Publicación de prueba automática con fines QA.`,
          price,
          category: product.category || 'juegos-gameboy',
          condition: 'used',
          originality_status: 'original_sin_verificar',
          originality_notes: 'Entrada de prueba automatizada.',
          images: imageUrl ? [imageUrl] : [],
          status: 'approved',
          listing_fee_cents: 0,
          commission_rate: 5,
          commission_cents: Math.round(price * 0.05),
          approved_at: new Date().toISOString(),
          delivery_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (ins.error) throw new Error(ins.error.message);
        counters.listings += 1;
      }

      actions += 1;

      if (enabled.summaries && enabled.likes && enabled.visits && enabled.reviews && Math.random() < 0.35) {
        await recalcSummary(supabase, productId);
      }
    } catch (error: any) {
      counters.errors += 1;
      console.warn('Acción omitida por error:', error?.message || error);
    }

    await wait(paceMs);
  }

  if (enabled.summaries && enabled.likes && enabled.visits && enabled.reviews) {
    for (const id of touchedProducts) {
      try {
        await recalcSummary(supabase, id);
      } catch (error: any) {
        counters.errors += 1;
        console.warn(`Error recalculando summary ${id}:`, error?.message || error);
      }
    }
  }

  console.log('✅ Simulación demo finalizada');
  console.log({ minutes, paceMs, actions, touchedProducts: touchedProducts.size, counters });
}

main().catch((error) => {
  console.error('❌ Simulación falló:', error?.message || error);
  process.exit(1);
});
