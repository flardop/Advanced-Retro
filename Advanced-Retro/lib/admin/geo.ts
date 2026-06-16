import type { NextRequest } from 'next/server';

function readPayloadString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function toDisplayCountry(value: string) {
  const clean = String(value || '').trim();
  if (!clean) return null;

  if (/^[a-z]{2}$/i.test(clean)) {
    try {
      const displayNames = new Intl.DisplayNames(['es-ES'], { type: 'region' });
      return displayNames.of(clean.toUpperCase()) || clean.toUpperCase();
    } catch {
      return clean.toUpperCase();
    }
  }

  return clean;
}

function toDisplayLocation(city: string, region: string) {
  const cityClean = String(city || '').trim();
  const regionClean = String(region || '').trim();

  if (cityClean && regionClean) {
    return `${cityClean}, ${regionClean}`;
  }
  return cityClean || regionClean || null;
}

export function resolveGeoFromRequest(request: NextRequest, payload: Record<string, unknown>) {
  const payloadCountry = readPayloadString(payload, 'country');
  const payloadCity = readPayloadString(payload, 'city');

  const headerCountry =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    '';
  const headerCity = request.headers.get('x-vercel-ip-city') || request.headers.get('x-appengine-city') || '';
  const headerRegion =
    request.headers.get('x-vercel-ip-country-region') ||
    request.headers.get('x-appengine-region') ||
    '';

  return {
    country: toDisplayCountry(payloadCountry || headerCountry),
    city: toDisplayLocation(payloadCity || headerCity, headerRegion),
  };
}
