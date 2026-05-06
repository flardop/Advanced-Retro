import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';

const isProduction =
  process.env.VERCEL_ENV === 'production' || process.env.ENFORCE_CANONICAL_HOST === 'true';

function getCanonicalHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';
  if (!raw) return '';
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(normalized).host.toLowerCase();
  } catch {
    return '';
  }
}

function isLocalHost(host: string): boolean {
  return host.includes('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
}

function shouldNoIndexByQuery(url: { pathname: string; searchParams: URLSearchParams }): boolean {
  if (!url.searchParams || url.searchParams.size === 0) return false;
  const pathname = String(url.pathname || '').toLowerCase();
  if (pathname === '/tienda') return true;
  if (pathname.startsWith('/producto/')) return true;
  return false;
}

function applyNoIndexHeaderIfNeeded(response: NextResponse, request: NextRequest): NextResponse {
  if (shouldNoIndexByQuery(request.nextUrl)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

async function resolveUserRole(request: NextRequest, response: NextResponse, userId: string) {
  try {
    const supabase = createMiddlewareSupabaseClient(request, response);
    const profileRes = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const profileRole = String(profileRes.data?.role || '').trim();
    if (profileRole) return profileRole;

    const legacyRes = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
    return String(legacyRes.data?.role || 'user').trim() || 'user';
  } catch {
    return 'user';
  }
}

async function handleAdminAccess(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isAdminRoute(pathname)) {
    return null;
  }

  const isLoginRoute = pathname === '/admin/login';
  const response = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  if (!user) {
    return response;
  }

  const role = await resolveUserRole(request, response, user.id);
  if (isLoginRoute && role === 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('error', 'admin-only');
    return NextResponse.redirect(url);
  }

  return response;
}

function handleCanonicalHost(request: NextRequest, baseResponse?: NextResponse) {
  if (!isProduction) {
    return applyNoIndexHeaderIfNeeded(baseResponse || NextResponse.next(), request);
  }

  const canonicalHost = getCanonicalHost();
  if (!canonicalHost) {
    return applyNoIndexHeaderIfNeeded(baseResponse || NextResponse.next(), request);
  }

  const incomingHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .toLowerCase()
    .trim();
  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').toLowerCase().trim();
  const shouldBeHttps = forwardedProto !== 'https';

  if (!incomingHost || isLocalHost(incomingHost)) {
    return applyNoIndexHeaderIfNeeded(baseResponse || NextResponse.next(), request);
  }

  const hostChanged = incomingHost !== canonicalHost;
  if (!hostChanged && !shouldBeHttps) {
    return applyNoIndexHeaderIfNeeded(baseResponse || NextResponse.next(), request);
  }

  const url = request.nextUrl.clone();
  url.protocol = 'https:';
  url.host = canonicalHost;
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const adminResponse = await handleAdminAccess(request);
  if (adminResponse && adminResponse.status !== 200) {
    return adminResponse;
  }
  return handleCanonicalHost(request, adminResponse || undefined);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/game/snake/leaderboard).*)',
  ],
};
