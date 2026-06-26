import { NextRequest } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return Response.json({ success: false, error: 'Supabase service role no configurado' }, { status: 503 });
    }
    const payload = await request.json();
    const displayName = String(payload.display_name || '').trim().slice(0, 80) || null;
    const email = String(payload.email || '').trim().toLowerCase();
    const intent = payload.intent === 'event' ? 'event' : 'newsletter';
    const eventSlug = String(payload.event_slug || '').trim().slice(0, 80) || null;
    const eventTitle = String(payload.event_title || '').trim().slice(0, 140) || null;
    const roleLabel = String(payload.role_label || '').trim().slice(0, 80) || null;
    const source = String(payload.source || 'public').trim().slice(0, 40) || 'public';
    const path = String(payload.path || '/retroville').trim().slice(0, 180) || '/retroville';
    const pageTitle = String(payload.page_title || '').trim().slice(0, 180) || null;
    const sessionId = String(payload.session_id || '').trim().slice(0, 120) || null;
    const deviceType = String(payload.device_type || '').trim().slice(0, 24) || null;
    const browser = String(payload.browser || '').trim().slice(0, 48) || null;
    const os = String(payload.os || '').trim().slice(0, 48) || null;
    const referrer = String(payload.referrer || '').trim().slice(0, 300) || null;
    if (!email || !email.includes('@')) {
      return Response.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }

    const upsertAttempts = [
      {
        email,
        display_name: displayName,
        role_label: roleLabel,
        source,
        signup_intent: intent,
        event_slug: eventSlug,
        event_title: eventTitle,
      },
      {
        email,
        display_name: displayName,
        role_label: roleLabel,
        source,
      },
      {
        email,
      },
    ] as const;

    let lastMissingColumnError: Error | null = null;

    for (const record of upsertAttempts) {
      const upsertResult = await supabaseService.from('retroville_waitlist').upsert(record, { onConflict: 'email' });
      if (!upsertResult.error) {
        lastMissingColumnError = null;
        break;
      }

      const message = String(upsertResult.error.message || '').toLowerCase();
      const missingColumn =
        (message.includes('column') && message.includes('does not exist')) ||
        (message.includes('could not find') && message.includes('schema cache'));

      if (!missingColumn) {
        throw new Error(upsertResult.error.message || 'No se pudo registrar en la waitlist');
      }

      lastMissingColumnError = upsertResult.error;
    }

    if (lastMissingColumnError) {
      throw new Error(lastMissingColumnError.message || 'No se pudo registrar en la waitlist');
    }

    const analyticsInsert = await supabaseService.from('analytics_events').insert({
      event_name: intent === 'event' ? 'retroville_event_signup' : 'retroville_newsletter_signup',
      path,
      session_id: sessionId,
      meta: {
        intent,
        display_name: displayName,
        source,
        role_label: roleLabel,
        event_slug: eventSlug,
        event_title: eventTitle,
        page_title: pageTitle,
        device_type: deviceType,
        browser,
        os,
        referrer,
      },
    });

    if (analyticsInsert.error) {
      // Do not fail the signup if the analytics insert is unavailable.
    }

    return Response.json({
      success: true,
      data: {
        display_name: displayName,
        email,
        role_label: roleLabel,
        source,
        intent,
        event_slug: eventSlug,
        event_title: eventTitle,
        path,
        session_id: sessionId,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar' }, { status: 500 });
  }
}
