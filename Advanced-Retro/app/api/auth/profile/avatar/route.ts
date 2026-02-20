import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AVATAR_BUCKET = 'profile-avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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

async function ensureAvatarBucket() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Error listing storage buckets: ${listError.message}`);

  const exists = (buckets || []).some(
    (bucket) => bucket.name === AVATAR_BUCKET || bucket.id === AVATAR_BUCKET
  );
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_AVATAR_BYTES}`,
    allowedMimeTypes: Object.keys(MIME_TO_EXT),
  });

  if (createError) {
    const message = String(createError.message || '').toLowerCase();
    if (message.includes('already exists') || message.includes('duplicate')) return;
    throw new Error(`Error creating avatar bucket: ${createError.message}`);
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
    const avatar = formData?.get('avatar');

    if (!(avatar instanceof File)) {
      return NextResponse.json({ error: 'Debes seleccionar una imagen' }, { status: 400 });
    }

    const mime = String(avatar.type || '').toLowerCase();
    const ext = MIME_TO_EXT[mime];
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no válido. Usa JPG, PNG, WEBP o GIF.' },
        { status: 400 }
      );
    }

    if (!avatar.size || avatar.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera el tamaño máximo (5 MB).' },
        { status: 400 }
      );
    }

    await ensureAvatarBucket();

    const filePath = `users/${user.id}/avatar-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Buffer.from(await avatar.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, bytes, {
        contentType: mime,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicFile } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    const avatarUrl = String(publicFile?.publicUrl || '').trim();
    if (!avatarUrl) {
      return NextResponse.json({ error: 'No se pudo obtener la URL de la imagen' }, { status: 500 });
    }

    const { data: profile, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id,email,role,name,avatar_url,bio,is_verified_seller,created_at,updated_at')
      .single();

    if (updateError || !profile) {
      if (isMissingColumnError(updateError)) {
        return NextResponse.json(
          {
            error:
              'Faltan columnas de perfil en la base de datos. Ejecuta el SQL: database/admin_chat_seller_features.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: updateError?.message || 'No se pudo guardar el avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      profile,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
