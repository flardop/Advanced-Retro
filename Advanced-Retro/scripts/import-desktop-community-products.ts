import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createUserListing } from '@/lib/userListings';
import { fetchEbayMarketSnapshotByQueryWithOptions } from '@/lib/ebayBrowse';

type ProductSeed = {
  folderToken: string;
  title: string;
  searchQuery: string;
  category:
    | 'juegos-gameboy'
    | 'juegos-gameboy-color'
    | 'juegos-gameboy-advance'
    | 'juegos-super-nintendo'
    | 'juegos-gamecube'
    | 'cajas-gameboy'
    | 'manuales'
    | 'accesorios'
    | 'consolas-retro';
  condition: 'new' | 'used' | 'restored';
  originalityStatus: 'original_verificado' | 'original_sin_verificar' | 'repro_1_1' | 'mixto';
  pegiRating: 'none' | '3' | '7' | '12' | '16' | '18';
  genre: string;
  packageSize: 'small' | 'medium' | 'large' | 'oversize';
  itemColor: string;
  fallbackPriceEur: number;
  description: string;
  originalityNotes: string;
};

type UploadedImage = {
  sourcePath: string;
  publicUrl: string;
};

const DESKTOP_PRODUCTS_DIR = '/Users/joelrivera/Desktop/productos';
const COMMUNITY_BUCKET = 'community-listings';
const MAX_IMAGES = 10;
const MIN_IMAGES = 3;
const DEFAULT_MARKETPLACE = process.env.EBAY_MARKETPLACE_ID || 'EBAY_ES';

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    folderToken: 'mario bros',
    title: 'Super Mario Bros (Game Boy) lote completo',
    searchQuery: 'Super Mario Bros Game Boy',
    category: 'juegos-gameboy',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: '3',
    genre: 'Plataformas',
    packageSize: 'small',
    itemColor: 'multicolor',
    fallbackPriceEur: 54,
    description:
      'Lote de Super Mario Bros para Game Boy con fotos reales de estado, caja y extras visibles en el anuncio. Pieza pensada para coleccionista que quiere ver cada detalle antes de comprar.',
    originalityNotes:
      'Procedente de colección privada. Se vende como original sin certificado externo y con fotos detalladas para revisión.',
  },
  {
    folderToken: 'pokemon oro',
    title: 'Pokemon Oro (Game Boy Color) colección',
    searchQuery: 'Pokemon Gold Game Boy Color',
    category: 'juegos-gameboy-color',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: '3',
    genre: 'RPG',
    packageSize: 'small',
    itemColor: 'dorado',
    fallbackPriceEur: 89,
    description:
      'Pokemon Oro para Game Boy Color en formato colección, con fotografías de portada, interior y estado real. Ideal para completar vitrina retro de Nintendo portátil.',
    originalityNotes:
      'Unidad revisada visualmente. Originalidad indicada como sin verificar por tercero para máxima transparencia.',
  },
  {
    folderToken: 'donkey kong',
    title: 'Donkey Kong (Game Boy) edición clásica',
    searchQuery: 'Donkey Kong Game Boy',
    category: 'juegos-gameboy',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: '3',
    genre: 'Plataformas',
    packageSize: 'small',
    itemColor: 'amarillo',
    fallbackPriceEur: 46,
    description:
      'Donkey Kong clásico de Game Boy con galería completa de estado. Publicación orientada a comprador coleccionista con detalle de conservación en cada imagen.',
    originalityNotes:
      'Producto de segunda mano conservado. Sin certificación de grading, con inspección visual y material fotográfico completo.',
  },
  {
    folderToken: 'consola',
    title: 'Consola retro Nintendo portátil (lote completo)',
    searchQuery: 'Nintendo Game Boy console',
    category: 'consolas-retro',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: 'none',
    genre: 'Hardware',
    packageSize: 'large',
    itemColor: 'gris',
    fallbackPriceEur: 129,
    description:
      'Consola retro Nintendo portátil con lote fotográfico amplio para comprobar carcasa, pantalla y accesorios incluidos. Publicación enfocada a compra segura y transparente.',
    originalityNotes:
      'Consola de colección usada, fotografiada en detalle para validación del comprador antes de cerrar la operación.',
  },
  {
    folderToken: 'pokemon pinball',
    title: 'Pokemon Pinball (Game Boy Color) set',
    searchQuery: 'Pokemon Pinball Game Boy Color',
    category: 'juegos-gameboy-color',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: '3',
    genre: 'Arcade',
    packageSize: 'small',
    itemColor: 'multicolor',
    fallbackPriceEur: 64,
    description:
      'Pokemon Pinball para Game Boy Color con fotos reales de conservación. Buen candidato para vitrina temática Pokémon o colección de cartuchos clásicos.',
    originalityNotes:
      'Material revisado por el vendedor y publicado con fotografías sin ocultar desgaste para venta honesta.',
  },
  {
    folderToken: 'pokemon plata',
    title: 'Pokemon Plata (Game Boy Color) lote colección',
    searchQuery: 'Pokemon Silver Game Boy Color',
    category: 'juegos-gameboy-color',
    condition: 'used',
    originalityStatus: 'original_sin_verificar',
    pegiRating: '3',
    genre: 'RPG',
    packageSize: 'small',
    itemColor: 'plata',
    fallbackPriceEur: 79,
    description:
      'Pokemon Plata en lote de colección para Game Boy Color, con imágenes detalladas del estado del artículo. Pensado para comprador que valora transparencia y detalle.',
    originalityNotes:
      'Pieza de segunda mano en estado funcional y visual mostrado. Original sin verificación externa de terceros.',
  },
];

function isImageFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic', '.heif'].includes(ext);
}

function extToMime(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.avif':
      return 'image/avif';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    default:
      return 'application/octet-stream';
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function inferSeedFromFolder(folderName: string): ProductSeed | null {
  const normalized = folderName.toLowerCase();
  for (const seed of PRODUCT_SEEDS) {
    if (normalized.includes(seed.folderToken)) return seed;
  }
  return null;
}

function roundToCompetitiveCents(cents: number): number {
  if (!Number.isFinite(cents) || cents <= 0) return 100;
  const rounded = Math.round(cents / 50) * 50;
  return Math.max(100, rounded);
}

async function ensureBucket(): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase no configurado (falta URL/service role).');

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`No se pudo listar buckets: ${listError.message}`);

  const exists = (buckets || []).some(
    (bucket) => bucket.name === COMMUNITY_BUCKET || bucket.id === COMMUNITY_BUCKET
  );
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(COMMUNITY_BUCKET, {
    public: true,
    fileSizeLimit: `${12 * 1024 * 1024}`,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/heic',
      'image/heif',
    ],
  });

  if (createError) {
    throw new Error(`No se pudo crear bucket ${COMMUNITY_BUCKET}: ${createError.message}`);
  }
}

async function getUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  if (!supabaseAdmin) throw new Error('Supabase no configurado');
  const safeEmail = email.trim().toLowerCase();
  if (!safeEmail) return null;

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,email')
    .eq('email', safeEmail)
    .maybeSingle();
  if (error) throw new Error(`No se pudo consultar users: ${error.message}`);
  if (data?.id) return { id: String(data.id), email: String(data.email || safeEmail) };

  const users = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const fromAuth = (users.data?.users || []).find(
    (u) => String(u.email || '').trim().toLowerCase() === safeEmail
  );
  if (!fromAuth?.id) return null;

  const fallbackName = safeEmail.split('@')[0] || 'usuario';
  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: fromAuth.id,
        email: safeEmail,
        name: fallbackName,
        role: 'user',
        is_verified_seller: true,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
  if (upsertError) {
    throw new Error(
      `Usuario encontrado en auth pero no se pudo sincronizar en users: ${upsertError.message}`
    );
  }

  return { id: fromAuth.id, email: safeEmail };
}

async function ensureSellerVerified(userId: string): Promise<void> {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_verified_seller: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) {
    // No bloqueamos importación por esto.
    console.warn(`Aviso: no se pudo marcar seller verificado (${error.message})`);
  }
}

async function uploadFolderImages(
  userId: string,
  folderPath: string,
  listingSlug: string
): Promise<UploadedImage[]> {
  if (!supabaseAdmin) throw new Error('Supabase no configurado');
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .slice(0, MAX_IMAGES);

  if (files.length < MIN_IMAGES) {
    throw new Error(
      `La carpeta ${path.basename(folderPath)} solo tiene ${files.length} imágenes válidas (mínimo ${MIN_IMAGES}).`
    );
  }

  const uploaded: UploadedImage[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const fileName = files[i];
    const absolutePath = path.join(folderPath, fileName);
    const bytes = await fs.readFile(absolutePath);
    const ext = path.extname(fileName).toLowerCase() || '.jpg';
    const mime = extToMime(ext);

    const storagePath = `users/${userId}/imports/${listingSlug}/${Date.now()}-${i + 1}-${randomUUID().slice(0, 8)}${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(COMMUNITY_BUCKET)
      .upload(storagePath, bytes, {
        contentType: mime,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Error subiendo ${fileName}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(COMMUNITY_BUCKET)
      .getPublicUrl(storagePath);
    const publicUrl = String(publicUrlData?.publicUrl || '').trim();
    if (!publicUrl) {
      throw new Error(`No se pudo obtener URL pública para ${fileName}`);
    }

    uploaded.push({
      sourcePath: absolutePath,
      publicUrl,
    });
  }

  return uploaded;
}

async function resolveCompetitivePriceCents(seed: ProductSeed): Promise<{ cents: number; source: string }> {
  const fallbackCents = Math.round(seed.fallbackPriceEur * 100);
  try {
    const snapshot = await fetchEbayMarketSnapshotByQueryWithOptions(seed.searchQuery, {
      marketplaceId: DEFAULT_MARKETPLACE,
      allowMarketplaceFallback: true,
      searchLimit: 40,
      targetSampleSize: 12,
    });

    if (!snapshot.available) {
      return { cents: fallbackCents, source: `fallback (sin eBay: ${snapshot.note || 'sin datos'})` };
    }

    const reference =
      snapshot.medianPrice ??
      snapshot.averagePrice ??
      snapshot.minPrice ??
      fallbackCents;
    const aggressiveFactor = 0.94;
    const competitiveCents = roundToCompetitiveCents(Math.round(reference * aggressiveFactor));
    return {
      cents: competitiveCents,
      source: `eBay ${snapshot.marketplaceId} (mediana/media ajustada -6%)`,
    };
  } catch (error: any) {
    return {
      cents: fallbackCents,
      source: `fallback (error eBay: ${error?.message || 'desconocido'})`,
    };
  }
}

async function updateExistingListing(listingId: string, payload: Record<string, unknown>): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase no configurado');
  const nowIso = new Date().toISOString();
  const extended = {
    ...payload,
    status: 'approved',
    updated_at: nowIso,
    delivery_status: 'pending',
  };

  const { error } = await supabaseAdmin
    .from('user_product_listings')
    .update(extended)
    .eq('id', listingId);
  if (!error) return;

  const minimal = {
    title: payload.title,
    description: payload.description,
    price: payload.price,
    category: payload.category,
    condition: payload.condition,
    originality_status: payload.originality_status,
    originality_notes: payload.originality_notes,
    images: payload.images,
    status: 'approved',
    updated_at: nowIso,
  };
  const retry = await supabaseAdmin
    .from('user_product_listings')
    .update(minimal)
    .eq('id', listingId);
  if (retry.error) {
    throw new Error(`No se pudo actualizar anuncio ${listingId}: ${retry.error.message}`);
  }
}

async function main() {
  const targetEmail = String(process.argv[2] || 'flardop66@gmail.com').trim().toLowerCase();
  if (!supabaseAdmin) {
    throw new Error('Supabase no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  }

  console.log(`Importando productos de Desktop para: ${targetEmail}`);
  await ensureBucket();

  const user = await getUserByEmail(targetEmail);
  if (!user) {
    throw new Error(`No existe un usuario con email ${targetEmail} en users/auth.`);
  }
  await ensureSellerVerified(user.id);

  const rootEntries = await fs.readdir(DESKTOP_PRODUCTS_DIR, { withFileTypes: true });
  const productDirs = rootEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

  if (productDirs.length === 0) {
    throw new Error(`No hay carpetas de producto en ${DESKTOP_PRODUCTS_DIR}`);
  }

  const summary: Array<{
    folder: string;
    listingId: string;
    title: string;
    priceCents: number;
    priceSource: string;
    action: 'created' | 'updated';
  }> = [];

  for (const folderName of productDirs) {
    const seed = inferSeedFromFolder(folderName);
    if (!seed) {
      console.log(`- Omitido ${folderName}: sin mapeo configurado`);
      continue;
    }

    const folderPath = path.join(DESKTOP_PRODUCTS_DIR, folderName);
    const listingSlug = slugify(seed.title);
    const uploadedImages = await uploadFolderImages(user.id, folderPath, listingSlug);
    const pricing = await resolveCompetitivePriceCents(seed);

    const payload = {
      title: seed.title,
      description: `${seed.description}\n\nIncluye ${uploadedImages.length} imágenes reales del producto publicado desde inventario propio.`,
      price: pricing.cents,
      category: seed.category,
      condition: seed.condition,
      originality_status: seed.originalityStatus,
      originality_notes: seed.originalityNotes,
      images: uploadedImages.map((item) => item.publicUrl),
      pegi_rating: seed.pegiRating,
      genre: seed.genre,
      package_size: seed.packageSize,
      item_color: seed.itemColor,
      is_featured: false,
      featured_days: 0,
      is_showcase: false,
      showcase_days: 0,
    };

    const existing = await supabaseAdmin
      .from('user_product_listings')
      .select('id,title')
      .eq('user_id', user.id)
      .eq('title', seed.title)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) {
      throw new Error(`No se pudo consultar anuncios existentes para ${seed.title}: ${existing.error.message}`);
    }

    if (existing.data?.id) {
      await updateExistingListing(String(existing.data.id), payload);
      summary.push({
        folder: folderName,
        listingId: String(existing.data.id),
        title: seed.title,
        priceCents: pricing.cents,
        priceSource: pricing.source,
        action: 'updated',
      });
      console.log(`- Actualizado: ${seed.title} (${(pricing.cents / 100).toFixed(2)} €)`);
      continue;
    }

    const created = await createUserListing(user.id, payload);
    const listingId = String(created?.id || '');
    if (!listingId) {
      throw new Error(`No se obtuvo ID de anuncio para ${seed.title}`);
    }

    await updateExistingListing(listingId, payload);
    summary.push({
      folder: folderName,
      listingId,
      title: seed.title,
      priceCents: pricing.cents,
      priceSource: pricing.source,
      action: 'created',
    });
    console.log(`- Creado: ${seed.title} (${(pricing.cents / 100).toFixed(2)} €)`);
  }

  console.log('\nResumen importación');
  console.log('===================');
  for (const item of summary) {
    console.log(
      `${item.action.toUpperCase()} | ${item.title} | ${(item.priceCents / 100).toFixed(2)} € | ${item.priceSource} | id=${item.listingId}`
    );
  }
  console.log(`\nTotal procesados: ${summary.length}`);
}

main().catch((error) => {
  console.error('Importación fallida:', error?.message || error);
  process.exit(1);
});

