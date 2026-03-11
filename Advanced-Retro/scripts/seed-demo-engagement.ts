/**
 * Seed DEMO de actividad para QA visual.
 *
 * Hace:
 * - Ajusta saldo de la cuenta flardop66@gmail.com a 1000 EUR.
 * - Crea usuarios demo (Auth + public.users) con avatar/banner.
 * - Genera likes, visitas y reseñas coherentes en productos aleatorios.
 * - Publica algunos anuncios y posts de comunidad.
 * - Guarda credenciales demo en docs/demo-users-generated.md.
 *
 * Uso:
 *   npx tsx scripts/seed-demo-engagement.ts
 */

import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

type DemoUserSeed = {
  handle: string;
  name: string;
  email: string;
  password: string;
  tagline: string;
  bio: string;
  favoriteConsole: string;
  profileTheme: 'neon-grid' | 'sunset-glow' | 'arcade-purple' | 'mint-wave';
};

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  stock: number | null;
  image: string | null;
  images: string[] | null;
};

const TARGET_EMAIL = 'flardop66@gmail.com';
const TARGET_BALANCE_CENTS = 100_000;
const DEMO_DOMAIN = 'advancedretro.local';
const DEMO_LABEL = '[DEMO]';
const ACK_ENV = 'DEMO_SEED_I_UNDERSTAND';

const DEMO_USERS: DemoUserSeed[] = [
  {
    handle: 'jurritd',
    name: 'jurritd',
    email: `jurritd.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026A',
    tagline: 'Compro y vendo clásicos completos',
    bio: 'Coleccionista de cartuchos clásicos. Busco estado cuidado y cajas en buen estado.',
    favoriteConsole: 'Game Boy',
    profileTheme: 'neon-grid',
  },
  {
    handle: 'augustincoy6',
    name: 'augustincoy6',
    email: `augustincoy6.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026B',
    tagline: 'Fan de Nintendo portátil',
    bio: 'Me centro en Game Boy Color y Advance, sobre todo ediciones europeas.',
    favoriteConsole: 'Game Boy Color',
    profileTheme: 'mint-wave',
  },
  {
    handle: 'paloma5665',
    name: 'paloma5665',
    email: `paloma5665.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026C',
    tagline: 'Colección limpia y verificada',
    bio: 'Suelo comprar lotes revisados y vender duplicados en estado muy bueno.',
    favoriteConsole: 'Super Nintendo',
    profileTheme: 'sunset-glow',
  },
  {
    handle: 'denisisiis',
    name: 'denisisiis',
    email: `denisisiis.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026D',
    tagline: 'Packing serio, envíos seguros',
    bio: 'Valoro embalajes sólidos, descripciones claras y atención rápida.',
    favoriteConsole: 'GameCube',
    profileTheme: 'arcade-purple',
  },
  {
    handle: 'axel.eln',
    name: 'axel.eln',
    email: `axeleln.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026E',
    tagline: 'Retro europeo PAL',
    bio: 'Priorizo versiones PAL y estado de manuales + inserts.',
    favoriteConsole: 'Game Boy Advance',
    profileTheme: 'neon-grid',
  },
  {
    handle: 'jac12566',
    name: 'jac12566',
    email: `jac12566.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026F',
    tagline: 'Compras rápidas y trato claro',
    bio: 'Me gustan compras directas, pagos rápidos y vendedores con fotos reales.',
    favoriteConsole: 'Game Boy',
    profileTheme: 'mint-wave',
  },
  {
    handle: 'cimencam',
    name: 'cimencam',
    email: `cimencam.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026G',
    tagline: 'Piezas con historia',
    bio: 'Combino colección personal con compra de lotes para restauración.',
    favoriteConsole: 'Super Nintendo',
    profileTheme: 'sunset-glow',
  },
  {
    handle: 'brigi18',
    name: 'brigi18',
    email: `brigi18.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026H',
    tagline: 'Todo sobre estado y autenticidad',
    bio: 'Me fijo mucho en etiquetas, estado del cartucho y conservación general.',
    favoriteConsole: 'Game Boy Color',
    profileTheme: 'arcade-purple',
  },
  {
    handle: 'luisac.prado',
    name: 'luisac.prado',
    email: `luisacprado.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026I',
    tagline: 'Clásicos funcionales',
    bio: 'Busco juegos funcionales para jugar y conservar a largo plazo.',
    favoriteConsole: 'GameCube',
    profileTheme: 'neon-grid',
  },
  {
    handle: 'mcc1979',
    name: 'mcc1979',
    email: `mcc1979.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026J',
    tagline: 'Revisión de lotes semanal',
    bio: 'Publico piezas sueltas y lotes pequeños con fotos de detalle.',
    favoriteConsole: 'Game Boy Advance',
    profileTheme: 'mint-wave',
  },
  {
    handle: 'enhteaunie',
    name: 'enhteaunie',
    email: `enhteaunie.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026K',
    tagline: 'Estado y detalles claros',
    bio: 'Compro por estado real del producto y calidad de fotos publicadas.',
    favoriteConsole: 'Game Boy Color',
    profileTheme: 'sunset-glow',
  },
  {
    handle: 'bob030279',
    name: 'bob030279',
    email: `bob030279.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026L',
    tagline: 'Retro casual collector',
    bio: 'Me interesan juegos completos y packs de consola revisados.',
    favoriteConsole: 'GameCube',
    profileTheme: 'arcade-purple',
  },
  {
    handle: 'marecelachi',
    name: 'marecelachi',
    email: `marecelachi.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026M',
    tagline: 'Colecciones por generación',
    bio: 'Construyo colección por generaciones, priorizando PAL en buen estado.',
    favoriteConsole: 'Super Nintendo',
    profileTheme: 'mint-wave',
  },
  {
    handle: 'dalia280286',
    name: 'dalia280286',
    email: `dalia280286.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026N',
    tagline: 'Afición y cuidado del material',
    bio: 'Prefiero unidades limpias, funcionales y con empaquetado sólido.',
    favoriteConsole: 'Game Boy',
    profileTheme: 'neon-grid',
  },
  {
    handle: 'phil.66',
    name: 'phil.66',
    email: `phil66.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026O',
    tagline: 'Piezas especiales y lotes',
    bio: 'Busco piezas concretas y valoro mucho la transparencia del vendedor.',
    favoriteConsole: 'Game Boy Advance',
    profileTheme: 'sunset-glow',
  },
  {
    handle: 'rosemariemartos',
    name: 'rosemariemartos',
    email: `rosemariemartos.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026P',
    tagline: 'Compras seguras de retro',
    bio: 'Me centran las compras seguras con envío bien protegido y seguimiento.',
    favoriteConsole: 'Game Boy Color',
    profileTheme: 'arcade-purple',
  },
  {
    handle: 'cristinaballestero',
    name: 'cristinaballestero',
    email: `cristinaballestero.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026Q',
    tagline: 'Enfoque en calidad visual',
    bio: 'Comparo estado visual y precio de mercado antes de comprar.',
    favoriteConsole: 'GameCube',
    profileTheme: 'mint-wave',
  },
  {
    handle: 'kachslim',
    name: 'kachslim',
    email: `kachslim.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026R',
    tagline: 'Comprador rápido',
    bio: 'Si el estado es coherente con la ficha, compro rápido.',
    favoriteConsole: 'Super Nintendo',
    profileTheme: 'neon-grid',
  },
  {
    handle: 'vinted-auto',
    name: 'Vinted',
    email: `vinted.auto.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026S',
    tagline: 'Cuenta demo automática',
    bio: 'Cuenta automática de prueba para validar flujo de comentarios.',
    favoriteConsole: 'Game Boy',
    profileTheme: 'sunset-glow',
  },
  {
    handle: 'luisac.prado2',
    name: 'luisac.prado2',
    email: `luisacprado2.demo@${DEMO_DOMAIN}`,
    password: 'DemoRetro!2026T',
    tagline: 'Variantes y accesorios',
    bio: 'Normalmente combino cartucho con manual, insert y protector.',
    favoriteConsole: 'Game Boy Advance',
    profileTheme: 'arcade-purple',
  },
];

const POSITIVE_COMMENTS = [
  'Muy buen estado para colección, encaja con lo que buscaba.',
  'La descripción coincide y el precio está bien para este título.',
  'Entrega rápida y juego en estado correcto. Recomendado.',
  'Buen lote y embalaje sólido. Todo conforme.',
  'Producto cuidado, ideal para completar colección.',
];

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

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled<T>(items: T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveAvatarUrl(handle: string): string {
  return `https://i.pravatar.cc/256?u=${encodeURIComponent(`advancedretro-${handle}`)}`;
}

function resolveBannerUrl(handle: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(`advancedretro-banner-${handle}`)}/1400/420`;
}

function productComment(product: ProductRow, rating: number): string {
  const name = String(product.name || 'producto');
  const category = String(product.category || '').toLowerCase();
  const suffix = rating >= 4 ? 'Volvería a comprar en esta tienda.' : 'Cumple, aunque hay margen de mejora.';

  if (category.includes('gamecube')) {
    return `${DEMO_LABEL} ${name}: buen estado para GameCube y presentación cuidada. ${suffix}`;
  }
  if (category.includes('super-nintendo') || category.includes('snes')) {
    return `${DEMO_LABEL} ${name}: pieza interesante para colección SNES, relación calidad/precio correcta. ${suffix}`;
  }
  if (category.includes('game-boy-advance')) {
    return `${DEMO_LABEL} ${name}: artículo de GBA bien conservado y útil para completar set. ${suffix}`;
  }
  if (category.includes('game-boy-color')) {
    return `${DEMO_LABEL} ${name}: buen material para GBC, se ve bastante fiel a la descripción. ${suffix}`;
  }
  if (category.includes('cajas') || category.includes('insert') || category.includes('manual')) {
    return `${DEMO_LABEL} ${name}: complemento útil para completar edición, calidad visual correcta. ${suffix}`;
  }
  if (category.includes('consolas')) {
    return `${DEMO_LABEL} ${name}: consola revisada y bien presentada, compra recomendable para coleccionismo. ${suffix}`;
  }
  return `${DEMO_LABEL} ${name}: ${pick(POSITIVE_COMMENTS)} ${suffix}`;
}

function parseMissingColumn(errorMessage: string): string | null {
  const m = errorMessage.match(/Could not find the '([^']+)' column of 'users' in the schema cache/i);
  return m?.[1] ?? null;
}

async function upsertPublicUserResilient(supabase: any, payload: Record<string, any>) {
  const requiredKeys = new Set(['id', 'email', 'role', 'name', 'updated_at']);
  const currentPayload: Record<string, any> = { ...payload };
  while (true) {
    const res = await supabase.from('users').upsert(currentPayload as any, { onConflict: 'id' });
    if (!res.error) return;

    const missing = parseMissingColumn(res.error.message || '');
    if (!missing) {
      throw new Error(`Error upsert public.users ${payload.email}: ${res.error.message}`);
    }
    if (requiredKeys.has(missing)) {
      throw new Error(`Falta columna obligatoria '${missing}' en public.users`);
    }
    if (!(missing in currentPayload)) {
      throw new Error(`Error upsert public.users ${payload.email}: ${res.error.message}`);
    }
    delete currentPayload[missing];
    console.warn(`   - Columna opcional no encontrada en users: ${missing}. Continúo sin ella.`);
  }
}

async function main() {
  loadEnvLocal();

  if (process.env[ACK_ENV] !== 'YES') {
    throw new Error(
      `Protección activa: exporta ${ACK_ENV}=YES para ejecutar este seed de datos DEMO.`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('1) Cargando productos para generar actividad...');
  const productsRes = await supabase
    .from('products')
    .select('id,name,category,price,stock,image,images,is_mystery_box')
    .gt('stock', 0)
    .eq('is_mystery_box', false)
    .order('updated_at', { ascending: false })
    .limit(300);
  if (productsRes.error) throw new Error(productsRes.error.message);
  const products = (productsRes.data || []) as (ProductRow & { is_mystery_box?: boolean })[];
  if (products.length === 0) throw new Error('No hay productos disponibles para seed');

  console.log('2) Creando/actualizando usuarios demo en Auth + public.users...');
  const authUsersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authUsersRes.error) throw new Error(authUsersRes.error.message);

  const authByEmail = new Map(
    (authUsersRes.data?.users || []).map((u) => [String(u.email || '').toLowerCase(), u])
  );

  const createdUsers: Array<DemoUserSeed & { id: string }> = [];

  for (const demo of DEMO_USERS) {
    const emailKey = demo.email.toLowerCase();
    let authUser = authByEmail.get(emailKey) || null;

    if (!authUser) {
      const createRes = await supabase.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: {
          full_name: demo.name,
          name: demo.name,
        },
      });
      if (createRes.error) throw new Error(`Error creando ${demo.email}: ${createRes.error.message}`);
      authUser = createRes.data.user;
      authByEmail.set(emailKey, authUser);
    } else {
      const updateAuth = await supabase.auth.admin.updateUserById(authUser.id, {
        password: demo.password,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          full_name: demo.name,
          name: demo.name,
        },
      });
      if (updateAuth.error) throw new Error(`Error actualizando auth ${demo.email}: ${updateAuth.error.message}`);
    }

    const avatar_url = resolveAvatarUrl(demo.handle);
    const banner_url = resolveBannerUrl(demo.handle);
    await upsertPublicUserResilient(supabase, {
      id: authUser.id,
      email: demo.email.toLowerCase(),
      role: 'user',
      name: demo.name,
      avatar_url,
      banner_url,
      bio: demo.bio,
      tagline: demo.tagline,
      favorite_console: demo.favoriteConsole,
      profile_theme: demo.profileTheme,
      favorites_visibility: 'public',
      is_verified_seller: true,
      updated_at: new Date().toISOString(),
    });

    const walletSeed = await supabase.from('user_wallet_accounts').upsert(
      {
        user_id: authUser.id,
        balance_cents: 0,
        pending_cents: 0,
        total_earned_cents: 0,
        total_withdrawn_cents: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (walletSeed.error) throw new Error(`Error seed wallet ${demo.email}: ${walletSeed.error.message}`);

    createdUsers.push({ ...demo, id: authUser.id });
  }

  console.log(`   Usuarios demo listos: ${createdUsers.length}`);

  console.log(`3) Ajustando saldo de ${TARGET_EMAIL} a 1000 EUR...`);
  const targetUserRes = await supabase
    .from('users')
    .select('id,email')
    .ilike('email', TARGET_EMAIL)
    .maybeSingle();
  if (targetUserRes.error) throw new Error(`No se pudo localizar ${TARGET_EMAIL}: ${targetUserRes.error.message}`);
  if (!targetUserRes.data?.id) throw new Error(`No existe usuario ${TARGET_EMAIL} en public.users`);
  const targetUserId = String(targetUserRes.data.id);

  const targetWalletRes = await supabase
    .from('user_wallet_accounts')
    .select('user_id,total_earned_cents')
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (targetWalletRes.error) throw new Error(targetWalletRes.error.message);

  const currentEarned = Math.max(0, Number(targetWalletRes.data?.total_earned_cents || 0));
  const setWalletRes = await supabase.from('user_wallet_accounts').upsert(
    {
      user_id: targetUserId,
      balance_cents: TARGET_BALANCE_CENTS,
      pending_cents: 0,
      total_earned_cents: Math.max(currentEarned, TARGET_BALANCE_CENTS),
      total_withdrawn_cents: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (setWalletRes.error) throw new Error(setWalletRes.error.message);

  const walletRef = 'seed-set-balance-1000-eur-v1';
  const txExists = await supabase
    .from('user_wallet_transactions')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('kind', 'manual_adjustment')
    .eq('reference_type', 'seed_script')
    .eq('reference_id', walletRef)
    .maybeSingle();
  if (txExists.error) throw new Error(txExists.error.message);
  if (!txExists.data?.id) {
    const txInsert = await supabase.from('user_wallet_transactions').insert({
      user_id: targetUserId,
      amount_cents: TARGET_BALANCE_CENTS,
      direction: 'credit',
      status: 'available',
      kind: 'manual_adjustment',
      description: 'Seed demo: ajuste de saldo a 1000 EUR',
      reference_type: 'seed_script',
      reference_id: walletRef,
      metadata: { source: 'seed-demo-engagement' },
      created_by: targetUserId,
    });
    if (txInsert.error) throw new Error(txInsert.error.message);
  }

  console.log('4) Generando likes, visitas y reseñas en productos aleatorios...');
  const shuffledProducts = shuffled(products);
  const touchedProductIds = new Set<string>();
  const likesRows: Array<{ product_id: string; user_id: string }> = [];
  const visitsRows: Array<{ product_id: string; visitor_key: string; visits_count: number; last_visit_at: string }> =
    [];
  const reviewRows: Array<{
    product_id: string;
    user_id: string;
    visitor_key: string;
    author_name: string;
    rating: number;
    comment: string;
    photos: string[];
    created_at: string;
    updated_at: string;
  }> = [];

  for (const user of createdUsers) {
    const picks = shuffled(shuffledProducts).slice(0, randomInt(3, 6));
    for (const product of picks) {
      const productId = String(product.id);
      touchedProductIds.add(productId);
      likesRows.push({ product_id: productId, user_id: user.id });
      visitsRows.push({
        product_id: productId,
        visitor_key: `auth-${user.id}`,
        visits_count: randomInt(1, 8),
        last_visit_at: new Date(Date.now() - randomInt(1, 35) * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (Math.random() < 0.74) {
        const rating = Math.random() < 0.8 ? randomInt(4, 5) : 3;
        const comment = productComment(product, rating);
        reviewRows.push({
          product_id: productId,
          user_id: user.id,
          visitor_key: `auth-${user.id}`,
          author_name: user.name,
          rating,
          comment,
          photos: [],
          created_at: new Date(Date.now() - randomInt(2, 70) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (likesRows.length > 0) {
    const likesInsert = await supabase
      .from('product_likes')
      .upsert(likesRows, { onConflict: 'product_id,user_id', ignoreDuplicates: true });
    if (likesInsert.error) throw new Error(likesInsert.error.message);
  }

  if (visitsRows.length > 0) {
    const visitsInsert = await supabase
      .from('product_social_visits')
      .upsert(visitsRows, { onConflict: 'product_id,visitor_key' });
    if (visitsInsert.error) throw new Error(visitsInsert.error.message);
  }

  if (reviewRows.length > 0) {
    const reviewsInsert = await supabase
      .from('product_social_reviews')
      .upsert(reviewRows, {
        onConflict: 'product_id,visitor_key,rating,comment',
        ignoreDuplicates: true,
      });
    if (reviewsInsert.error) throw new Error(reviewsInsert.error.message);
  }

  const touchedIds = [...touchedProductIds];
  for (const productId of touchedIds) {
    const [likesCountRes, visitsRes, reviewsRes] = await Promise.all([
      supabase.from('product_likes').select('user_id', { count: 'exact', head: true }).eq('product_id', productId),
      supabase.from('product_social_visits').select('visits_count').eq('product_id', productId).limit(1000),
      supabase.from('product_social_reviews').select('rating').eq('product_id', productId).limit(1000),
    ]);

    if (likesCountRes.error) throw new Error(likesCountRes.error.message);
    if (visitsRes.error) throw new Error(visitsRes.error.message);
    if (reviewsRes.error) throw new Error(reviewsRes.error.message);

    const likesCount = Math.max(0, Number(likesCountRes.count || 0));
    const visits = (visitsRes.data || []).reduce((acc, row: any) => acc + Math.max(0, Number(row.visits_count || 0)), 0);
    const ratings = (reviewsRes.data || [])
      .map((row: any) => Number(row.rating || 0))
      .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= 5);
    const reviewsCount = ratings.length;
    const ratingAverage =
      reviewsCount > 0
        ? Number((ratings.reduce((a, b) => a + b, 0) / reviewsCount).toFixed(2))
        : 0;

    const summaryUpsert = await supabase.from('product_social_summary').upsert(
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
    if (summaryUpsert.error) throw new Error(summaryUpsert.error.message);
  }

  console.log('5) Creando anuncios y posts demo de comunidad...');
  const listingsRows: any[] = [];
  const communityPostRows: any[] = [];

  for (const user of createdUsers) {
    const product = pick(shuffledProducts);
    const baseImage = Array.isArray(product.images) && product.images.length > 0
      ? String(product.images[0] || '').trim()
      : String(product.image || '').trim();
    const imageUrl = baseImage || '/logo.png';
    const listingPrice = Math.max(100, Math.round(Number(product.price || 2400) * (0.78 + Math.random() * 0.3)));
    listingsRows.push({
      id: randomUUID(),
      user_id: user.id,
      title: `${DEMO_LABEL} ${product.name} · Comunidad`,
      description:
        `${DEMO_LABEL} Anuncio de comunidad de ${product.name}. Pieza revisada con fotos reales y estado indicado en la ficha.`,
      price: listingPrice,
      category: product.category || 'juegos-gameboy',
      condition: Math.random() < 0.25 ? 'new' : 'used',
      originality_status: pick(['original_sin_verificar', 'original_verificado', 'repro_1_1']),
      originality_notes: 'Datos de prueba para dar movimiento al marketplace comunitario.',
      images: [imageUrl],
      status: 'approved',
      listing_fee_cents: 0,
      commission_rate: 5,
      commission_cents: Math.round(listingPrice * 0.05),
      approved_at: new Date().toISOString(),
      delivery_status: pick(['pending', 'processing', 'shipped']),
      created_at: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (Math.random() < 0.55) {
      communityPostRows.push({
        id: randomUUID(),
        user_id: user.id,
        title: `${DEMO_LABEL} Restauración y estado de ${product.name}`,
        content:
          `${DEMO_LABEL} He revisado ${product.name} y comparto observaciones de conservación, limpieza y embalaje para compradores.`,
        images: [imageUrl],
        likes_count: randomInt(0, 8),
        created_at: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  for (const row of listingsRows) {
    const exists = await supabase
      .from('user_product_listings')
      .select('id')
      .eq('user_id', row.user_id)
      .eq('title', row.title)
      .maybeSingle();
    if (exists.error) throw new Error(exists.error.message);
    if (!exists.data?.id) {
      const ins = await supabase.from('user_product_listings').insert(row);
      if (ins.error) throw new Error(ins.error.message);
    }
  }

  for (const row of communityPostRows) {
    const exists = await supabase
      .from('community_posts')
      .select('id')
      .eq('user_id', row.user_id)
      .eq('title', row.title)
      .maybeSingle();
    if (exists.error) throw new Error(exists.error.message);
    if (!exists.data?.id) {
      const ins = await supabase.from('community_posts').insert(row);
      if (ins.error) throw new Error(ins.error.message);
    }
  }

  console.log('6) Generando documento de credenciales demo...');
  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
  const file = resolve(docsDir, 'demo-users-generated.md');
  const nowIso = new Date().toISOString();
  const lines = [
    '# Usuarios demo generados',
    '',
    '> Archivo generado automáticamente por `scripts/seed-demo-engagement.ts`.',
    '> SOLO para entorno de pruebas. No usar en producción.',
    '',
    `Fecha: ${nowIso}`,
    '',
    '## Saldo objetivo',
    '',
    `- Cuenta: \`${TARGET_EMAIL}\``,
    '- Saldo fijado: **1000,00 EUR** en cartera interna (`user_wallet_accounts.balance_cents = 100000`).',
    '',
    '## Credenciales demo',
    '',
    '| Usuario | Email | Password |',
    '|---|---|---|',
    ...createdUsers.map((u) => `| ${u.name} | \`${u.email}\` | \`${u.password}\` |`),
    '',
    '## Notas',
    '',
    '- Estos usuarios se crean en `auth.users` y se sincronizan con `public.users`.',
    '- También se generan likes/reseñas/visitas y actividad de comunidad para QA visual.',
  ];
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');

  console.log('✅ Seed demo completado');
  console.log(`   - Productos tocados: ${touchedIds.length}`);
  console.log(`   - Reseñas procesadas: ${reviewRows.length}`);
  console.log(`   - Likes procesados: ${likesRows.length}`);
  console.log(`   - Documento: ${file}`);
}

main().catch((error) => {
  console.error('❌ Seed demo falló:', error?.message || error);
  process.exit(1);
});
