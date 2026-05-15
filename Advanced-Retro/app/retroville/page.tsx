import type { Metadata } from 'next';
import RetrovilleExperience from '@/components/retroville/RetrovilleExperience';
import StructuredData from '@/components/StructuredData';
import { supabaseService } from '@/lib/supabase/service';
import { absoluteUrl } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Retroville — El Universo Original de AdvancedRetro',
  description:
    'Retroville: una ciudad donde el hardware olvidado sigue vivo. NOX, Button Crew y un universo oscuro y cómico construido desde los restos de lo que fue jugado y olvidado. Noviembre 2026.',
  keywords: 'retroville, universo retro, world building gaming, personajes retro, NOX, Button Crew, AdvancedRetro',
  alternates: {
    canonical: 'https://advancedretro.es/retroville',
  },
  openGraph: {
    title: 'Retroville — El Universo Original de AdvancedRetro',
    description: 'Una ciudad construida de hardware abandonado. Noviembre 2026.',
    url: 'https://advancedretro.es/retroville',
    siteName: 'AdvancedRetro.es',
    images: [
      {
        url: 'https://advancedretro.es/retroville/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Retroville — Universo AdvancedRetro',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retroville — El Universo Original de AdvancedRetro',
    description: 'Una ciudad donde el hardware olvidado nunca se apagó del todo. Noviembre 2026.',
    images: ['https://advancedretro.es/retroville/opengraph-image'],
  },
};

async function getRetrovilleState() {
  const fallbackDate = new Date('2026-11-10T00:00:00.000Z');
  const fallbackIso = fallbackDate.toISOString();

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: fallbackDate.toLocaleDateString('es-ES', {
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
  const launchDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : fallbackDate;

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

export default async function RetrovillePage() {
  const { launchIso, launchLabel, waitlistCount } = await getRetrovilleState();

  const retrovilleSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Retroville',
    url: absoluteUrl('/retroville'),
    description:
      'Retroville es un universo narrativo donde el hardware olvidado sigue vivo. Una ciudad oscura de neón, personajes corruptos y torneos retro.',
    image: absoluteUrl('/images/retroville/retroville-street.png'),
    about: [
      { '@type': 'Thing', name: 'World building retro' },
      { '@type': 'Thing', name: 'Universo narrativo gaming' },
      { '@type': 'Thing', name: 'AdvancedRetro' },
    ],
  };

  return (
    <>
      <StructuredData id="retroville-schema" data={retrovilleSchema} />
      <RetrovilleExperience launchIso={launchIso} launchLabel={launchLabel} waitlistCount={waitlistCount} />
    </>
  );
}
