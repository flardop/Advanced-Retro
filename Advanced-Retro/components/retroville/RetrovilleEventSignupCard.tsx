'use client';

import { CalendarDays, Download } from 'lucide-react';
import { useMemo } from 'react';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';

const FALLBACK_EVENT_URL = 'https://advancedretro.es/retroville';
const EVENT_TITLE = 'Primer reveal público de Retroville';
const EVENT_LOCATION = 'Online · AdvancedRetro';

function parseEventDate(launchIso: string) {
  const parsed = new Date(launchIso);
  if (Number.isFinite(parsed.getTime())) return parsed;
  return new Date('2026-11-10T00:00:00.000Z');
}

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function toCalendarDateToken(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildEventDetails(eventUrl: string) {
  return `Guarda esta fecha para no perderte el primer reveal público de Retroville y el siguiente drop oficial. Más info: ${eventUrl}`;
}

function buildGoogleCalendarHref(launchIso: string) {
  const eventDate = parseEventDate(launchIso);
  const start = toCalendarDateToken(eventDate);
  const end = toCalendarDateToken(addUtcDays(eventDate, 1));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    details: buildEventDetails(FALLBACK_EVENT_URL),
    location: EVENT_LOCATION,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsFile(launchIso: string, eventUrl: string) {
  const eventDate = parseEventDate(launchIso);
  const start = toCalendarDateToken(eventDate);
  const end = toCalendarDateToken(addUtcDays(eventDate, 1));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AdvancedRetro//Retroville//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:retroville-first-reveal-${start}@advancedretro.es`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `DESCRIPTION:${escapeIcsText(buildEventDetails(eventUrl))}`,
    `LOCATION:${escapeIcsText(EVENT_LOCATION)}`,
    `URL:${escapeIcsText(eventUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

function trackCalendarAction(channel: 'google' | 'ics') {
  if (typeof window === 'undefined') return;

  window.gtag?.('event', 'retroville_event_calendar_save', {
    event_category: 'retroville',
    event_label: channel,
  });

  window.plausible?.('Retroville event calendar save', {
    props: { channel },
  });
}

export default function RetrovilleEventSignupCard({
  launchIso,
  launchLabel,
}: {
  launchIso: string;
  launchLabel: string;
}) {
  const googleCalendarHref = useMemo(() => buildGoogleCalendarHref(launchIso), [launchIso]);

  function handleDownloadIcs() {
    if (typeof window === 'undefined') return;

    const eventUrl = `${window.location.origin}/retroville`;
    const blob = new Blob([buildIcsFile(launchIso, eventUrl)], {
      type: 'text/calendar;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'retroville-primer-reveal.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    trackCalendarAction('ics');
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[rgba(196,58,47,0.24)] bg-[linear-gradient(145deg,rgba(196,58,47,0.12),rgba(8,8,8,0.94)_42%,rgba(212,154,67,0.12))] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-[28px] items-center rounded-full border border-[rgba(196,58,47,0.34)] bg-[rgba(196,58,47,0.12)] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          Primer reveal
        </span>
        <span className="inline-flex min-h-[28px] items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78">
          {launchLabel}
        </span>
        <span className="inline-flex min-h-[28px] items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78">
          Online
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(300px,0.98fr)]">
        <div>
          <h3 className="text-[clamp(1.8rem,2.6vw,2.4rem)] font-semibold uppercase leading-[0.95] text-white">
            Apúntate y guarda el evento
          </h3>
          <p className="mt-3 max-w-[38rem] text-sm leading-7 text-[var(--rv-text-muted)]">
            Si quieres estar cuando Retroville lance su primera señal pública, déjanos tu nombre y tu email. Después puedes guardarlo en tu calendario con un clic.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={googleCalendarHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackCalendarAction('google')}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-[rgba(196,58,47,0.34)] bg-[rgba(196,58,47,0.12)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[rgba(196,58,47,0.54)] hover:bg-[rgba(196,58,47,0.2)]"
            >
              <CalendarDays className="h-4 w-4" />
              Guardar en Google Calendar
            </a>
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84 transition hover:border-white/22 hover:bg-white/[0.1] hover:text-white"
            >
              <Download className="h-4 w-4" />
              Descargar .ics
            </button>
          </div>

          <p className="mt-3 text-xs leading-6 text-white/58">
            El archivo `.ics` funciona con Apple Calendar, Outlook y la mayoría de calendarios del móvil.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(7,11,22,0.72)] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(212,154,67,0.9)]">Registro rápido</p>
          <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">
            Te avisaremos antes del evento y te dejaremos dentro del siguiente drop oficial.
          </p>
          <div className="mt-4">
            <RetrovilleWaitlistForm
              darkMode
              showName
              intent="event"
              source="community-pulse-event"
              eventSlug="retroville-first-public-reveal"
              eventTitle={EVENT_TITLE}
              buttonLabel="Apuntarme al reveal"
              successMessage="Perfecto. Ya te hemos apuntado al primer reveal de Retroville."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
