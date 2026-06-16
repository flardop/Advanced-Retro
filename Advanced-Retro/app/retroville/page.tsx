import type { Metadata } from 'next';
import { headers } from 'next/headers';
import RetrovilleExperience from '@/components/retroville/RetrovilleExperience';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';
import { buildRetrovilleSeriesJsonLd, getRetrovilleState } from '@/app/retroville/shared';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Retroville | Serie original, personajes y worldbuilding',
  description:
    'Retroville es el universo original de AdvancedRetro: una serie de animación con NOX, Button Crew, Luna y una ciudad construida desde hardware olvidado, humor oscuro y worldbuilding propio.',
  path: '/retroville',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'retroville',
    'retroville serie',
    'retroville serie animada',
    'retroville personajes',
    'retroville worldbuilding',
    'nox retroville',
    'button crew',
    'luna retroville',
    'advancedretro serie',
    'universo retroville',
    'pitch retroville',
    'serie de animacion retro',
  ],
  image: '/images/retroville/retroville-street.png',
});

export default async function RetrovillePage() {
  const { launchIso, launchLabel, waitlistCount } = await getRetrovilleState();
  const userAgent = (await headers()).get('user-agent') || '';
  const initialMobileExperience = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

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
  const retrovilleSeriesSchema = {
    ...buildRetrovilleSeriesJsonLd({
      path: '/retroville',
      description:
        'Serie original en desarrollo ambientada en una ciudad donde el hardware olvidado sigue vivo entre humor oscuro, barrio y caos social.',
      image: '/images/retroville/retroville-street.png',
    }),
    character: [
      { '@type': 'Thing', name: 'NOX' },
      { '@type': 'Thing', name: 'Button Crew' },
      { '@type': 'Thing', name: 'Luna' },
    ],
    datePublished: launchIso,
  };
  const retrovilleBreadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
  ]);

  return (
    <>
      <StructuredData id="retroville-schema" data={[retrovilleSchema, retrovilleSeriesSchema, retrovilleBreadcrumbs]} />
      <RetrovilleExperience
        launchIso={launchIso}
        launchLabel={launchLabel}
        waitlistCount={waitlistCount}
        initialMobileExperience={initialMobileExperience}
      />
    </>
  );
}
