import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  if (!isProduction) {
    return applyNoIndexHeaderIfNeeded(NextResponse.next(), request);
  }

  const canonicalHost = getCanonicalHost();
  if (!canonicalHost) {
    return applyNoIndexHeaderIfNeeded(NextResponse.next(), request);
  }

  const incomingHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .toLowerCase()
    .trim();
  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').toLowerCase().trim();
  const shouldBeHttps = forwardedProto !== 'https';

  if (!incomingHost || isLocalHost(incomingHost)) {
    return applyNoIndexHeaderIfNeeded(NextResponse.next(), request);
  }

  const hostChanged = incomingHost !== canonicalHost;
  if (!hostChanged && !shouldBeHttps) {
    return applyNoIndexHeaderIfNeeded(NextResponse.next(), request);
  }

  const url = request.nextUrl.clone();
  url.protocol = 'https:';
  url.host = canonicalHost;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/game/snake/leaderboard).*)',
  ],
};
