import { NextRequest, NextResponse } from 'next/server';
import { checkMembershipAccess, getUserMembership } from '@/lib/membership';
import {
  STOREFRONT_PREVIEW_COOKIE,
  buildStorefrontPreviewRecord,
  decodePreviewStorefront,
  findSampleStorefront,
  getStoredStorefrontBySlug,
  encodePreviewStorefront,
  normalizeStoreTheme,
  sanitizeHexColor,
  slugifyStoreName,
} from '@/lib/storefronts';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function cleanText(value: unknown, max = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Necesitas iniciar sesión para crear tu tienda.' }, { status: 401 });
    }

    const allowed = await checkMembershipAccess(user.id, 'collector');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Tu nivel actual no permite crear tienda. Sube a Coleccionista o VIP Retro.' }, { status: 403 });
    }

    const body = await request.json();
    const name = cleanText(body.name, 80);
    const shortDescription = cleanText(body.shortDescription, 240);
    const longDescription = cleanText(body.longDescription, 1200);
    const category = cleanText(body.category, 100) || 'Coleccionables';
    const theme = normalizeStoreTheme(body.theme);
    const primaryColor = sanitizeHexColor(String(body.primaryColor || '#66c0f4'));
    const slug = slugifyStoreName(body.slug || name);
    const instagram = cleanText(body.instagram, 120) || null;
    const twitter = cleanText(body.twitter, 120) || null;
    const contactEmail = cleanText(body.contactEmail || user.email || '', 160) || null;
    const membership = await getUserMembership(user.id);

    if (!name || !shortDescription || !slug) {
      return NextResponse.json({ success: false, error: 'Faltan datos obligatorios para crear la tienda.' }, { status: 400 });
    }

    const sampleStore = findSampleStorefront(slug);
    if (sampleStore) {
      return NextResponse.json({ success: false, error: 'Ese slug ya está ocupado.' }, { status: 409 });
    }

    const storedStore = await getStoredStorefrontBySlug(slug);
    if (storedStore && storedStore.ownerId && storedStore.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ese slug ya está ocupado.' }, { status: 409 });
    }

    const previewCookie = decodePreviewStorefront(request.cookies.get(STOREFRONT_PREVIEW_COOKIE)?.value);
    if (previewCookie && previewCookie.slug === slug && previewCookie.ownerId && previewCookie.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ese slug ya está ocupado.' }, { status: 409 });
    }

    const record = buildStorefrontPreviewRecord({
      slug,
      name,
      shortDescription,
      longDescription,
      category,
      theme,
      primaryColor,
      contactEmail,
      instagram,
      twitter,
      ownerId: user.id,
      membershipTier: membership.tier,
    });

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('creator_stores').upsert(
          {
            user_id: user.id,
            slug: record.slug,
            name: record.name,
            short_description: record.shortDescription,
            long_description: record.longDescription,
            category: record.category,
            theme: record.theme,
            primary_color: record.primaryColor,
            contact_email: record.contactEmail,
            instagram: record.instagram,
            twitter: record.twitter,
            state: record.state,
            product_limit: record.productLimit,
            membership_tier: record.membershipTier,
            products: record.products,
          },
          { onConflict: 'slug' }
        );
      } catch {
        // Optional persistence table may not exist yet. Preview cookie remains the fallback.
      }
    }

    const response = NextResponse.json({ success: true, slug: record.slug, store: record });
    response.cookies.set({
      name: STOREFRONT_PREVIEW_COOKIE,
      value: encodePreviewStorefront(record),
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'No se pudo generar la tienda.' },
      { status: 500 }
    );
  }
}
