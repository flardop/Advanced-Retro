import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseService } from '@/lib/supabase/service';

const RETROVILLE_FALLBACK_DATE = new Date('2026-11-10T00:00:00.000Z');
export const RETROVILLE_NEWSLETTER_NAME = 'La Señal de Retroville';
export const RETROVILLE_SIGNUP_COUNT_THRESHOLD = 25;
export const RETROVILLE_GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'googlebffb5f7b5e8a2336';

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
    label: 'Reddit',
    href: 'https://www.reddit.com/user/Flardop/',
    ariaLabel: 'Abrir Reddit de Retroville',
    eyebrow: 'Posts largos',
    description: 'Espacio para lore, builds más extensas y conversaciones menos inmediatas.',
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
    label: 'Presentación',
    href: '/retroville/presentaciones',
    eyebrow: 'Pitch',
    description: 'Versión presentable del proyecto para enseñar el universo de un vistazo.',
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

export function buildRetrovilleLaunchCopy(launchLabel: string) {
  return `El ${launchLabel} llega la primera señal publica de Retroville: activamos el primer reveal, abrimos el siguiente drop y avisamos primero a quienes ya reciben La Señal.`;
}

export async function getRetrovilleState() {
  const fallbackIso = RETROVILLE_FALLBACK_DATE.toISOString();

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: formatRetrovilleLaunchLabel(RETROVILLE_FALLBACK_DATE),
      waitlistCount: 0,
    };
  }

  const [settingsRes, waitlistRes] = await Promise.all([
    supabaseService
      .from('admin_settings')
      .select('value')
      .eq('key', 'retroville_launch_date')
      .maybeSingle(),
    supabaseService.from('retroville_waitlist').select('id', { count: 'exact', head: true }),
  ]);

  const parsedDate = new Date(String(settingsRes.data?.value || fallbackIso));
  const launchDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : RETROVILLE_FALLBACK_DATE;

  return {
    launchIso: launchDate.toISOString(),
    launchLabel: formatRetrovilleLaunchLabel(launchDate),
    waitlistCount: Math.max(0, Number(waitlistRes.count || 0)),
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
      name: 'AdvancedRetro.es',
      url: absoluteUrl('/'),
    },
    author: {
      '@type': 'Organization',
      name: 'AdvancedRetro.es',
      url: absoluteUrl('/'),
    },
    sameAs: RETROVILLE_SOCIAL_CHANNELS.map((channel) => channel.href),
  };
}
