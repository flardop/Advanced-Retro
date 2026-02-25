import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  getSellerSocialSummary,
  readSellerSocialState,
  toggleSellerProfileLike,
  trackSellerProfileVisit,
  writeSellerSocialState,
} from '@/lib/communitySellerSocial';
import { normalizeVisitorId, toVisitorStorageKey } from '@/lib/productSocialStorage';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function resolveVisitorId(raw: unknown, authUserId?: string): string | null {
  if (authUserId) return `auth-${authUserId}`;
  return normalizeVisitorId(raw);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sellerId = String(params?.id || '').trim();
    if (!sellerId) return badRequest('Seller id requerido');

    const user = await getOptionalAuthUser();
    const visitorId = resolveVisitorId(req.nextUrl.searchParams.get('visitorId'), user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;

    const state = await readSellerSocialState(sellerId);
    return NextResponse.json({
      success: true,
      sellerId,
      summary: getSellerSocialSummary(state, visitorKey),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar la actividad pública del vendedor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sellerId = String(params?.id || '').trim();
    if (!sellerId) return badRequest('Seller id requerido');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Payload inválido');

    const action = String((body as any).action || '').trim();
    if (!action) return badRequest('action es requerido');

    const user = await getOptionalAuthUser();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `seller-social:${sellerId}:${action}:${user?.id || ip}`,
      maxRequests: action === 'visit' ? 90 : 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas acciones en poco tiempo. Inténtalo de nuevo en 1 minuto.' },
        { status: 429 }
      );
    }

    const visitorId = resolveVisitorId((body as any).visitorId, user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    if (!visitorKey) return badRequest('visitorId requerido');

    const state = await readSellerSocialState(sellerId);

    if (action === 'visit') {
      trackSellerProfileVisit(state, visitorKey);
      await writeSellerSocialState(sellerId, state);
      return NextResponse.json({
        success: true,
        summary: getSellerSocialSummary(state, visitorKey),
      });
    }

    if (action === 'toggle_like') {
      const liked = toggleSellerProfileLike(state, visitorKey);
      await writeSellerSocialState(sellerId, state);
      return NextResponse.json({
        success: true,
        liked,
        summary: getSellerSocialSummary(state, visitorKey),
      });
    }

    return badRequest('Acción no soportada');
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo actualizar el perfil público del vendedor' },
      { status: 500 }
    );
  }
}

