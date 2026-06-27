import { NextRequest } from 'next/server';
import { resolveGeoFromRequest } from '@/lib/admin/geo';
import { serverLogError } from '@/lib/admin/serverErrorLogger';
import { supabaseService } from '@/lib/supabase/service';

function readPayloadString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function sanitizeMeta(meta: unknown) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {} as Record<string, string | number | boolean | null>;
  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (!key.trim()) continue;
    if (typeof value === 'string') {
      const clean = value.trim();
      if (clean) sanitized[key] = clean.slice(0, 240);
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      sanitized[key] = value;
      continue;
    }
    if (value === null) {
      sanitized[key] = null;
    }
  }

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return Response.json({ success: false, error: 'Supabase service role no configurado' }, { status: 503 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const eventName = readPayloadString(payload, 'event_name', 'eventName').slice(0, 120);
    const path = readPayloadString(payload, 'path') || '/retroville';

    if (!eventName || !eventName.startsWith('retroville_')) {
      return Response.json({ success: false, error: 'Evento no permitido' }, { status: 400 });
    }

    const geo = resolveGeoFromRequest(request, payload);

    const sessionId = readPayloadString(payload, 'session_id', 'sessionId') || null;
    const pageTitle = readPayloadString(payload, 'page_title', 'pageTitle') || null;
    const referrer = readPayloadString(payload, 'referrer') || null;
    const deviceType = readPayloadString(payload, 'device_type', 'deviceType') || null;
    const browser = readPayloadString(payload, 'browser') || null;
    const os = readPayloadString(payload, 'os') || null;
    const meta = sanitizeMeta(payload.meta);

    const insertResult = await supabaseService.from('analytics_events').insert({
      event_name: eventName,
      path: path.slice(0, 240),
      session_id: sessionId,
      meta: {
        ...meta,
        page_title: pageTitle,
        referrer,
        device_type: deviceType,
        browser,
        os,
        country: geo.country,
        city: geo.city,
      },
    });

    if (insertResult.error) {
      throw new Error(insertResult.error.message || 'No se pudo guardar el evento');
    }

    return Response.json({ success: true });
  } catch (error) {
    await serverLogError(error, { source: 'retroville-track-route' }).catch(() => null);
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar el evento' }, { status: 500 });
  }
}
