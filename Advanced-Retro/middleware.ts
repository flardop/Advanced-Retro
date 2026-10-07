import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import {
  RETROVILLE_ADMIN_COOKIE_NAME,
  RETROVILLE_ADMIN_HOME_PATH,
  RETROVILLE_ADMIN_LOGIN_PATH,
} from '@/lib/retroville-admin/constants';
import { isRetrovilleStandalone, retrovillePublicPath } from '@/lib/siteConfig';

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
  if (isRetrovilleStandalone() && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return false;
  }
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isRetrovilleAdminRoute(pathname: string) {
  const publicAdminPath = retrovillePublicPath('/retroville/admin');
  return pathname === publicAdminPath || pathname.startsWith(`${publicAdminPath}/`);
}

function isStandalonePassThroughPath(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

function handleStandalonePrefixedPath(request: NextRequest, response: NextResponse) {
  if (!isRetrovilleStandalone()) return null;
  const pathname = request.nextUrl.pathname;
  if (pathname !== '/retroville' && !pathname.startsWith('/retroville/')) return null;

  const url = request.nextUrl.clone();
  url.pathname = retrovillePublicPath(pathname);
  return redirectWithState(url, 308, response);
}

function rewriteStandaloneRetroville(request: NextRequest, response: NextResponse) {
  if (!isRetrovilleStandalone() || isStandalonePassThroughPath(request.nextUrl.pathname)) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname === '/' ? '/retroville' : `/retroville${request.nextUrl.pathname}`;
  return copyResponseState(response, NextResponse.rewrite(url));
}

function copyResponseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  source.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-length') return;
    if (key.toLowerCase() === 'location') return;
    target.headers.set(key, value);
  });

  return target;
}

function redirectWithState(url: URL, status: 307 | 308, response: NextResponse) {
  return copyResponseState(response, NextResponse.redirect(url, status));
}

async function refreshAuthSession(request: NextRequest) {
  const response = NextResponse.next();

  try {
    const supabase = createMiddlewareSupabaseClient(request, response);
    await supabase.auth.getUser();
  } catch {
    // best effort; don't block navigation if auth refresh fails
  }

  return response;
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

async function handleAdminAccess(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  if (!isAdminRoute(pathname)) {
    return null;
  }

  const isLoginRoute = pathname === '/admin/login';
  const supabase = createMiddlewareSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('redirectedFrom', pathname);
    return redirectWithState(url, 307, response);
  }

  if (!user) {
    return response;
  }

  const role = await resolveUserRole(request, response, user.id);
  if (isLoginRoute && role === 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    url.search = '';
    return redirectWithState(url, 307, response);
  }

  if (role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('error', 'admin-only');
    return redirectWithState(url, 307, response);
  }

  return response;
}

async function handleRetrovilleAdminAccess(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  if (!isRetrovilleAdminRoute(pathname)) {
    return null;
  }

  const adminHomePath = retrovillePublicPath(RETROVILLE_ADMIN_HOME_PATH);
  const adminLoginPath = retrovillePublicPath(RETROVILLE_ADMIN_LOGIN_PATH);
  const isAuthEntryRoute = pathname === adminHomePath || pathname === adminLoginPath;
  const sessionCookie = request.cookies.get(RETROVILLE_ADMIN_COOKIE_NAME)?.value;

  if (!sessionCookie && !isAuthEntryRoute) {
    const url = request.nextUrl.clone();
    url.pathname = adminHomePath;
    url.searchParams.set('redirectedFrom', pathname);
    return redirectWithState(url, 307, response);
  }

  if (pathname === adminLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = adminHomePath;
    return redirectWithState(url, 307, response);
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
  return redirectWithState(url, 308, baseResponse || NextResponse.next());
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await refreshAuthSession(request);
  const prefixedRedirect = handleStandalonePrefixedPath(request, sessionResponse);

  if (prefixedRedirect) {
    return prefixedRedirect;
  }

  const retrovilleAdminResponse = await handleRetrovilleAdminAccess(request, sessionResponse);

  if (retrovilleAdminResponse && retrovilleAdminResponse.headers.has('location')) {
    return retrovilleAdminResponse;
  }

  const adminResponse = await handleAdminAccess(request, retrovilleAdminResponse || sessionResponse);

  if (adminResponse && adminResponse.headers.has('location')) {
    return adminResponse;
  }

  const canonicalResponse = handleCanonicalHost(
    request,
    adminResponse || retrovilleAdminResponse || sessionResponse,
  );

  if (canonicalResponse.headers.has('location')) {
    return canonicalResponse;
  }

  return rewriteStandaloneRetroville(request, canonicalResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/game/snake/leaderboard).*)',
  ],
};
