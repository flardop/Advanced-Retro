import type { Metadata } from 'next';
import { headers } from 'next/headers';
import RetrovilleExperience from '@/components/retroville/RetrovilleExperience';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';
import { buildRetrovilleSeriesJsonLd, getRetrovilleState } from '@/app/retroville/shared';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Presentaciones de Retroville | Pitch oficial y reveal del universo',
  description:
    'Accede a la presentación oficial de Retroville: pitch actual, personajes, worldbuilding, newsletter y materiales base del universo original de AdvancedRetro.',
  path: '/retroville/presentaciones',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'presentaciones retroville',
    'pitch retroville',
    'retroville netflix',
    'retroville serie animada',
    'reveal retroville',
    'universo retroville',
    'advancedretro pitch',
  ],
  image: '/images/retroville/retroville-street.png',
});

export default async function RetrovillePresentacionesPage() {
  const { launchIso, launchLabel, waitlistCount } = await getRetrovilleState();
  const userAgent = (await headers()).get('user-agent') || '';
  const initialMobileExperience = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Presentaciones de Retroville',
    url: absoluteUrl('/retroville/presentaciones'),
    description:
      'Presentación oficial de Retroville con pitch, countdown, newsletter, personajes y worldbuilding del proyecto.',
    image: absoluteUrl('/images/retroville/retroville-street.png'),
    about: [
      { '@type': 'Thing', name: 'Pitch deck de serie original' },
      { '@type': 'Thing', name: 'Retroville' },
      { '@type': 'Thing', name: 'Universo narrativo gaming' },
    ],
  };
  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/presentaciones',
    description:
      'Presentación oficial del universo Retroville con tono de serie, personajes, ciudad, newsletter y materiales activos de desarrollo.',
    image: '/images/retroville/retroville-street.png',
    name: 'Presentación oficial de Retroville',
  });
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Presentaciones', path: '/retroville/presentaciones' },
  ]);

  return (
    <>
      <StructuredData
        id="retroville-presentaciones-schema"
        data={[pageSchema, retrovilleSeriesSchema, breadcrumbs]}
      />
      <RetrovilleExperience
        launchIso={launchIso}
        launchLabel={launchLabel}
        waitlistCount={waitlistCount}
        initialMobileExperience={initialMobileExperience}
      />
    </>
  );
}
