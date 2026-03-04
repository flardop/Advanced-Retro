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

export function middleware(request: NextRequest) {
  if (!isProduction) {
    return NextResponse.next();
  }

  const canonicalHost = getCanonicalHost();
  if (!canonicalHost) {
    return NextResponse.next();
  }

  const incomingHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .toLowerCase()
    .trim();
  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').toLowerCase().trim();
  const shouldBeHttps = forwardedProto !== 'https';

  if (!incomingHost || isLocalHost(incomingHost)) {
    return NextResponse.next();
  }

  const hostChanged = incomingHost !== canonicalHost;
  if (!hostChanged && !shouldBeHttps) {
    return NextResponse.next();
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
