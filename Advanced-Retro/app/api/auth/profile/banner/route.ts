import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BANNER_BUCKET = 'profile-banners';
const MAX_BANNER_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function isMissingColumnError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

async function ensureBannerBucket() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Error listing storage buckets: ${listError.message}`);

  const exists = (buckets || []).some(
    (bucket) => bucket.name === BANNER_BUCKET || bucket.id === BANNER_BUCKET
  );
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BANNER_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_BANNER_BYTES}`,
    allowedMimeTypes: Object.keys(MIME_TO_EXT),
  });

  if (createError) {
    const message = String(createError.message || '').toLowerCase();
    if (message.includes('already exists') || message.includes('duplicate')) return;
    throw new Error(`Error creating banner bucket: ${createError.message}`);
  }
}

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const formData = await req.formData().catch(() => null);
    const banner = formData?.get('banner');

    if (!(banner instanceof File)) {
      return NextResponse.json({ error: 'Debes seleccionar una imagen' }, { status: 400 });
    }

    const mime = String(banner.type || '').toLowerCase();
    const ext = MIME_TO_EXT[mime];
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no válido. Usa JPG, PNG, WEBP o GIF.' },
        { status: 400 }
      );
    }

    if (!banner.size || banner.size > MAX_BANNER_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera el tamaño máximo (8 MB).' },
        { status: 400 }
      );
    }

    await ensureBannerBucket();

    const filePath = `users/${user.id}/banner-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Buffer.from(await banner.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BANNER_BUCKET)
      .upload(filePath, bytes, {
        contentType: mime,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicFile } = supabaseAdmin.storage.from(BANNER_BUCKET).getPublicUrl(filePath);
    const bannerUrl = String(publicFile?.publicUrl || '').trim();
    if (!bannerUrl) {
      return NextResponse.json({ error: 'No se pudo obtener la URL de la portada' }, { status: 500 });
    }

    const { data: profile, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        banner_url: bannerUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id,email,role,name,avatar_url,banner_url,bio,tagline,favorite_console,profile_theme,badges,is_verified_seller,created_at,updated_at')
      .single();

    if (updateError || !profile) {
      if (isMissingColumnError(updateError)) {
        return NextResponse.json(
          {
            error:
              'Faltan columnas de personalización. Ejecuta SQL: database/admin_chat_seller_features.sql y database/profile_customization_upgrade.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: updateError?.message || 'No se pudo guardar la portada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      banner_url: bannerUrl,
      profile,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
