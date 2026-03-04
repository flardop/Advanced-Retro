import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateImageBinarySignature, validateListingImageName } from '@/lib/uploadSafety';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LISTING_BUCKET = 'community-listings';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function isFileLike(value: unknown): value is File {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as any).arrayBuffer === 'function' && typeof (value as any).name === 'string';
}

function resolveMimeAndExt(file: File): { mime: string; ext: string } | null {
  const mime = String(file.type || '').toLowerCase().trim();
  const extFromMime = MIME_TO_EXT[mime];
  if (extFromMime) {
    return {
      mime: EXT_TO_MIME[extFromMime] || mime,
      ext: extFromMime,
    };
  }

  const extFromName = String(file.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
    ?.trim();

  if (extFromName && EXT_TO_MIME[extFromName]) {
    return {
      mime: EXT_TO_MIME[extFromName],
      ext: extFromName === 'jpeg' ? 'jpg' : extFromName,
    };
  }

  return null;
}

async function ensureListingBucket() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Error listing storage buckets: ${listError.message}`);

  const exists = (buckets || []).some(
    (bucket) => bucket.name === LISTING_BUCKET || bucket.id === LISTING_BUCKET
  );
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(LISTING_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_BYTES}`,
    allowedMimeTypes: Object.keys(MIME_TO_EXT),
  });

  if (createError) {
    const message = String(createError.message || '').toLowerCase();
    if (message.includes('already exists') || message.includes('duplicate')) return;
    throw new Error(`Error creating listing bucket: ${createError.message}`);
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
    const image = formData?.get('image');

    if (!isFileLike(image)) {
      return NextResponse.json({ error: 'Debes seleccionar una imagen' }, { status: 400 });
    }

    const fileMeta = resolveMimeAndExt(image);
    if (!fileMeta) {
      return NextResponse.json(
        { error: 'Formato no válido. Usa JPG, PNG, WEBP, GIF, AVIF o HEIC.' },
        { status: 400 }
      );
    }

    const fileNameIssue = validateListingImageName(String(image.name || ''));
    if (fileNameIssue) {
      return NextResponse.json({ error: fileNameIssue }, { status: 400 });
    }

    if (!image.size || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera el tamaño máximo (12 MB).' },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const binaryValidationError = validateImageBinarySignature({
      bytes,
      mime: fileMeta.mime,
      ext: fileMeta.ext,
    });
    if (binaryValidationError) {
      return NextResponse.json({ error: binaryValidationError }, { status: 400 });
    }

    await ensureListingBucket();

    const filePath = `users/${user.id}/listings/${Date.now()}-${randomUUID().slice(0, 8)}.${fileMeta.ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LISTING_BUCKET)
      .upload(filePath, bytes, {
        contentType: fileMeta.mime,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicFile } = supabaseAdmin.storage.from(LISTING_BUCKET).getPublicUrl(filePath);
    const imageUrl = String(publicFile?.publicUrl || '').trim();
    if (!imageUrl) {
      return NextResponse.json({ error: 'No se pudo obtener la URL de la imagen' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: imageUrl, path: filePath });
  } catch (error: any) {
    return handleError(error);
  }
}
