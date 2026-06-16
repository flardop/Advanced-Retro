import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseService } from '@/lib/supabase/service';

const RETROVILLE_FALLBACK_DATE = new Date('2026-11-10T00:00:00.000Z');
export const RETROVILLE_NEWSLETTER_NAME = 'La Señal de Retroville';
export const RETROVILLE_SIGNUP_COUNT_THRESHOLD = 25;
export const RETROVILLE_GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'googlebffb5f7b5e8a2336';

const RETROVILLE_SAME_AS = [
  'https://www.instagram.com/retroville_show/',
  'https://www.youtube.com/@RetroVille-y9v',
  'https://x.com/Retr0ViIIe',
  'https://discord.gg/EyRRQJWW5D',
  'https://www.facebook.com/profile.php?id=61590571767017',
  'https://www.threads.com/@retroville_show?hl=es',
  'https://www.kickstarter.com/profile/1318310768',
] as const;

export function shouldShowRetrovilleSignupCount(count: number) {
  return Math.max(0, Number(count || 0)) >= RETROVILLE_SIGNUP_COUNT_THRESHOLD;
}

export async function getRetrovilleState() {
  const fallbackIso = RETROVILLE_FALLBACK_DATE.toISOString();

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: RETROVILLE_FALLBACK_DATE.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
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
    launchLabel: launchDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
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
    sameAs: [...RETROVILLE_SAME_AS],
  };
}
