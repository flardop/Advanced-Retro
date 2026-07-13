import { NextRequest } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return Response.json({ success: false, error: 'Supabase service role no configurado' }, { status: 503 });
    }
    const payload = await request.json();
    const firstName = String(payload.first_name || '').trim().slice(0, 80) || null;
    const lastName = String(payload.last_name || '').trim().slice(0, 120) || null;
    const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const displayName = String(payload.display_name || combinedName || '').trim().slice(0, 120) || null;
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = String(payload.phone || '').trim().slice(0, 40) || null;
    const question = String(payload.question || '').trim().slice(0, 2000) || null;
    const documentInterest = String(payload.document_interest || '').trim().slice(0, 180) || null;
    const intent = payload.intent === 'event' ? 'event' : payload.intent === 'access' ? 'access' : 'newsletter';
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
    const country = String(payload.country || '').trim().slice(0, 80) || null;
    const city = String(payload.city || '').trim().slice(0, 120) || null;
    const lastSeenAt = new Date().toISOString();
    if (!email || !email.includes('@')) {
      return Response.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }

    const upsertAttempts = [
      {
        email,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        phone,
        question,
        document_interest: documentInterest,
        role_label: roleLabel,
        source,
        page_path: path,
        page_title: pageTitle,
        session_id: sessionId,
        device_type: deviceType,
        browser,
        os,
        referrer,
        country,
        city,
        last_seen_at: lastSeenAt,
        signup_intent: intent,
        event_slug: eventSlug,
        event_title: eventTitle,
      },
      {
        email,
        display_name: displayName,
        role_label: roleLabel,
        source,
        page_path: path,
        page_title: pageTitle,
        session_id: sessionId,
        device_type: deviceType,
        browser,
        os,
        referrer,
        country,
        city,
        last_seen_at: lastSeenAt,
        signup_intent: intent,
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
      event_name:
        intent === 'event'
          ? 'retroville_event_signup'
          : intent === 'access'
            ? 'retroville_access_request_signup'
            : 'retroville_newsletter_signup',
      path,
      session_id: sessionId,
      meta: {
        intent,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        phone,
        question,
        document_interest: documentInterest,
        source,
        role_label: roleLabel,
        event_slug: eventSlug,
        event_title: eventTitle,
        page_title: pageTitle,
        device_type: deviceType,
        browser,
        os,
        referrer,
        country,
        city,
        last_seen_at: lastSeenAt,
      },
    });

    if (analyticsInsert.error) {
      // Do not fail the signup if the analytics insert is unavailable.
    }

    return Response.json({
      success: true,
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        email,
        phone,
        question,
        document_interest: documentInterest,
        role_label: roleLabel,
        source,
        intent,
        event_slug: eventSlug,
        event_title: eventTitle,
        path,
        page_title: pageTitle,
        session_id: sessionId,
        device_type: deviceType,
        browser,
        os,
        referrer,
        country,
        city,
        last_seen_at: lastSeenAt,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar' }, { status: 500 });
  }
}
