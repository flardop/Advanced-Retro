import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseService } from '@/lib/supabase/service';

const RETROVILLE_FALLBACK_DATE = new Date('2026-11-10T00:00:00.000Z');
export const RETROVILLE_NEWSLETTER_NAME = 'La Señal de Retroville';
export const RETROVILLE_SIGNUP_COUNT_THRESHOLD = 25;
export const RETROVILLE_GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'googlebffb5f7b5e8a2336';
export const RETROVILLE_PITCH_EMAIL = 'retr0ovllee@gmail.com';
export const RETROVILLE_SEO_IMAGE = '/images/retroville/retroville-cast-presentation.png';

export type RetrovilleAudienceBucket = {
  label: string;
  value: number;
  share: number;
};

export type RetrovilleAudienceSummary = {
  totalRegistrations: number;
  newsletterRegistrations: number;
  eventRegistrations: number;
  roleBreakdown: RetrovilleAudienceBucket[];
};

export type RetrovilleSocialChannel = {
  label: string;
  href: string;
  ariaLabel: string;
  eyebrow: string;
  description: string;
};

export type RetrovilleDiscoveryLink = {
  label: string;
  href: string;
  eyebrow: string;
  description: string;
};

type RetrovilleWaitlistRow = {
  role_label?: string | null;
  signup_intent?: string | null;
};

type RetrovilleSignupEventRow = {
  event_name?: string | null;
  meta?: Record<string, unknown> | null;
};

function toMailSafeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/·/g, '-');
}

export function buildRetrovillePitchMailto({
  subject,
  body,
}: {
  subject: string;
  body?: string;
}) {
  const normalizedSubject = toMailSafeText(subject);
  const normalizedBody = body
    ? toMailSafeText(body).replace(/\r?\n/g, '\r\n')
    : undefined;
  const query = [
    `subject=${encodeURIComponent(normalizedSubject)}`,
    normalizedBody ? `body=${encodeURIComponent(normalizedBody)}` : null,
  ]
    .filter(Boolean)
    .join('&');

  return `mailto:${RETROVILLE_PITCH_EMAIL}${query ? `?${query}` : ''}`;
}

export function buildRetrovillePitchGmailCompose({
  subject,
  body,
}: {
  subject: string;
  body?: string;
}) {
  const normalizedSubject = toMailSafeText(subject);
  const normalizedBody = body
    ? toMailSafeText(body).replace(/\r?\n/g, '\n')
    : undefined;
  const query = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: RETROVILLE_PITCH_EMAIL,
    su: normalizedSubject,
  });

  if (normalizedBody) {
    query.set('body', normalizedBody);
  }

  return `https://mail.google.com/mail/?${query.toString()}`;
}

export function buildRetrovillePitchOutlookCompose({
  subject,
  body,
}: {
  subject: string;
  body?: string;
}) {
  const normalizedSubject = toMailSafeText(subject);
  const normalizedBody = body
    ? toMailSafeText(body).replace(/\r?\n/g, '\n')
    : undefined;
  const query = new URLSearchParams({
    to: RETROVILLE_PITCH_EMAIL,
    subject: normalizedSubject,
  });

  if (normalizedBody) {
    query.set('body', normalizedBody);
  }

  return `https://outlook.office.com/mail/deeplink/compose?${query.toString()}`;
}

export function buildRetrovilleAccessRequestBody(documentTitle: string) {
  const safeTitle = toMailSafeText(documentTitle);
  return [
    'Hola equipo de Retroville,',
    '',
    'Mi nombre es [escribe aqui tu nombre].',
    'Soy [cuentanos quien eres, tu estudio, medio o proyecto].',
    `Quiero solicitar acceso a "${safeTitle}".`,
    'La necesito porque [explica brevemente por que la quieres y como la vas a usar].',
    '',
    'Gracias.',
  ].join('\n');
}

export const RETROVILLE_SOCIAL_CHANNELS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/retroville_show/',
    ariaLabel: 'Abrir Instagram de Retroville',
    eyebrow: 'Arte y drops',
    description: 'Piezas visuales, personajes, renders y primeras señales del universo.',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@RetroVille-y9v',
    ariaLabel: 'Abrir YouTube de Retroville',
    eyebrow: 'Video y reveal',
    description: 'Trailers, presentaciones, reels y contenido audiovisual del proyecto.',
  },
  {
    label: 'X',
    href: 'https://x.com/Retr0ViIIe',
    ariaLabel: 'Abrir X de Retroville',
    eyebrow: 'Updates rápidos',
    description: 'Señales cortas, avisos, fechas y movimiento diario del proyecto.',
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/EyRRQJWW5D',
    ariaLabel: 'Abrir Discord de Retroville',
    eyebrow: 'Comunidad activa',
    description: 'El canal para entrar dentro, hablar, seguir eventos y reaccionar en tiempo real.',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61590571767017',
    ariaLabel: 'Abrir Facebook de Retroville',
    eyebrow: 'Difusión general',
    description: 'Publicaciones amplias, anuncios públicos y acceso cómodo para nueva audiencia.',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@retroville_show?hl=es',
    ariaLabel: 'Abrir Threads de Retroville',
    eyebrow: 'Tono y conversación',
    description: 'Fragmentos del universo, comentarios y señales más ligeras en formato social.',
  },
  {
    label: 'Kickstarter',
    href: 'https://www.kickstarter.com/profile/1318310768',
    ariaLabel: 'Abrir Kickstarter de Retroville',
    eyebrow: 'Apoyo futuro',
    description: 'Punto natural para campaña, comunidad support y posibles coleccionables.',
  },
] as const satisfies readonly RetrovilleSocialChannel[];

export const RETROVILLE_DISCOVERY_LINKS = [
  {
    label: 'Personajes',
    href: '/retroville/personajes',
    eyebrow: 'Cast',
    description: 'Reparto principal, vecinos, facciones y fichas del universo.',
  },
  {
    label: 'Episodios',
    href: '/retroville/episodios',
    eyebrow: 'Temporada 1',
    description: 'Los diez episodios base de la T1 y la entrada separada de la T2 incoming.',
  },
  {
    label: 'Sketchbook',
    href: '/retroville/sketches',
    eyebrow: 'Proceso',
    description: 'Archivo visual con ciudad, props, vehículos y worldbuilding.',
  },
  {
    label: 'Guías visuales',
    href: '/retroville/guias',
    eyebrow: 'Desarrollo cast',
    description: 'Turnarounds, anatomy boards y hojas técnicas del reparto en un sitio separado.',
  },
  {
    label: 'Presentación',
    href: '/retroville/presentaciones',
    eyebrow: 'Pitch',
    description: 'Versión presentable del proyecto para enseñar el universo de un vistazo.',
  },
  {
    label: 'Comunidad',
    href: '/retroville/comunidad',
    eyebrow: 'Fandom',
    description: 'Archivo social con publicaciones, hashtags y señales compartibles del proyecto.',
  },
  {
    label: 'Press',
    href: '/retroville/press',
    eyebrow: 'Material oficial',
    description: 'Press kit, fact sheet y documentos listos para medios o partners.',
  },
] as const satisfies readonly RetrovilleDiscoveryLink[];

export const buildRetrovilleWaitlistBenefits = (launchLabel: string) =>
  [
    `Aviso prioritario el ${launchLabel} cuando se active el primer reveal publico.`,
    'Una señal quincenal con avances, materiales y drops del proyecto.',
    'Acceso anticipado a nuevos archivos y contenido exclusivo del desarrollo.',
  ] as const;

export function shouldShowRetrovilleSignupCount(count: number) {
  return Math.max(0, Number(count || 0)) >= RETROVILLE_SIGNUP_COUNT_THRESHOLD;
}

function formatRetrovilleLaunchLabel(date: Date) {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildAudienceBreakdown(values: Array<string | null | undefined>) {
  const labels = values.map((value) => String(value || 'Sin etiqueta').trim() || 'Sin etiqueta');
  const total = labels.length;
  const map = new Map<string, number>();

  labels.forEach((label) => {
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      share: total > 0 ? value / total : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function readMetaString(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function buildAudienceSummaryFromWaitlistRows(rows: RetrovilleWaitlistRow[]): RetrovilleAudienceSummary {
  const safeRows = Array.isArray(rows) ? rows : [];
  return {
    totalRegistrations: safeRows.length,
    newsletterRegistrations: safeRows.filter((row) => row.signup_intent === 'newsletter').length,
    eventRegistrations: safeRows.filter((row) => row.signup_intent === 'event').length,
    roleBreakdown: buildAudienceBreakdown(safeRows.map((row) => row.role_label)).slice(0, 4),
  };
}

function buildAudienceSummaryFromSignupEvents(rows: RetrovilleSignupEventRow[]): RetrovilleAudienceSummary {
  const safeRows = Array.isArray(rows) ? rows : [];
  return {
    totalRegistrations: safeRows.length,
    newsletterRegistrations: safeRows.filter((row) => row.event_name === 'retroville_newsletter_signup').length,
    eventRegistrations: safeRows.filter((row) => row.event_name === 'retroville_event_signup').length,
    roleBreakdown: buildAudienceBreakdown(safeRows.map((row) => readMetaString(row.meta, 'role_label'))).slice(0, 4),
  };
}

export function buildRetrovilleLaunchCopy(launchLabel: string) {
  return `El ${launchLabel} llega la primera señal publica de Retroville: activamos el primer reveal, abrimos el siguiente drop y avisamos primero a quienes ya reciben La Señal.`;
}

export async function getRetrovilleState() {
  const fallbackIso = RETROVILLE_FALLBACK_DATE.toISOString();
  const emptyAudienceSummary: RetrovilleAudienceSummary = {
    totalRegistrations: 0,
    newsletterRegistrations: 0,
    eventRegistrations: 0,
    roleBreakdown: [],
  };

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: formatRetrovilleLaunchLabel(RETROVILLE_FALLBACK_DATE),
      waitlistCount: 0,
      audienceSummary: emptyAudienceSummary,
    };
  }

  const [settingsRes, waitlistRes, signupEventsRes] = await Promise.all([
    supabaseService
      .from('admin_settings')
      .select('value')
      .eq('key', 'retroville_launch_date')
      .maybeSingle(),
    supabaseService
      .from('retroville_waitlist')
      .select('role_label, signup_intent', { count: 'exact' })
      .limit(5000),
    supabaseService
      .from('analytics_events')
      .select('event_name, meta')
      .in('event_name', [
        'retroville_newsletter_signup',
        'retroville_event_signup',
        'retroville_access_request_signup',
      ])
      .limit(5000),
  ]);

  const parsedDate = new Date(String(settingsRes.data?.value || fallbackIso));
  const launchDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : RETROVILLE_FALLBACK_DATE;
  const waitlistRows = (waitlistRes.data || []) as RetrovilleWaitlistRow[];
  const signupEventRows = (signupEventsRes.data || []) as RetrovilleSignupEventRow[];
  const waitlistSummary = buildAudienceSummaryFromWaitlistRows(waitlistRows);
  const signupEventSummary = buildAudienceSummaryFromSignupEvents(signupEventRows);
  const audienceSummary =
    waitlistSummary.totalRegistrations > 0 || signupEventSummary.totalRegistrations === 0
      ? waitlistSummary
      : signupEventSummary;
  const waitlistCount =
    waitlistSummary.totalRegistrations > 0
      ? Math.max(0, Number(waitlistRes.count || waitlistSummary.totalRegistrations))
      : signupEventSummary.totalRegistrations;

  return {
    launchIso: launchDate.toISOString(),
    launchLabel: formatRetrovilleLaunchLabel(launchDate),
    waitlistCount,
    audienceSummary,
  };
}

export function buildRetrovilleSeriesJsonLd(input: {
  path: string;
  description: string;
  image: string;
  name?: string;
}) {
  const path = input.path.startsWith('/') ? input.path : `/${input.path}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: input.name || 'Retroville',
    url: absoluteUrl(path),
    description: input.description,
    image: absoluteUrl(input.image),
    inLanguage: 'es-ES',
    genre: ['Animación', 'Comedia negra', 'Sci-fi retro'],
    creator: {
      '@type': 'Organization',
      name: 'Retroville',
      url: absoluteUrl('/'),
    },
    author: {
      '@type': 'Organization',
      name: 'Retroville',
      url: absoluteUrl('/'),
    },
    sameAs: RETROVILLE_SOCIAL_CHANNELS.map((channel) => channel.href),
  };
}
