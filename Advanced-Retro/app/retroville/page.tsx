import type { Metadata } from 'next';
import { headers } from 'next/headers';
import RetrovilleStudioEntry from '@/components/retroville/RetrovilleStudioEntry';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';
import { buildRetrovilleSeriesJsonLd, getRetrovilleState } from '@/app/retroville/shared';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Retroville | Serie animada original y material de pitch',
  description:
    'Retroville es una serie animada original de AdvancedRetro con cast, worldbuilding, T1, press kit y biblia privada para buyers, partners y medios.',
  path: '/retroville',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'retroville',
    'retroville serie',
    'retroville serie animada',
    'retroville pitch',
    'retroville press kit',
    'retroville biblia serie',
    'retroville buyer brief',
    'retroville personajes',
    'retroville worldbuilding',
    'nox retroville',
    'button crew',
    'luna retroville',
    'advancedretro serie',
    'universo retroville',
    'pitch retroville',
    'serie animada original',
    'coproduccion animacion',
    'press kit serie animada',
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
      'Retroville es una serie animada original con cast, worldbuilding, materiales de pitch y acceso privado a la biblia de la serie.',
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
        'Serie original en desarrollo ambientada en una ciudad donde el hardware olvidado sigue vivo entre humor oscuro, barrio, cast coral y materiales listos para pitch.',
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
  const retrovilleFaq = buildFaqJsonLd([
    {
      question: '¿Qué es Retroville?',
      answer:
        'Retroville es una serie animada original de AdvancedRetro ambientada en una ciudad construida con hardware abandonado, humor negro y worldbuilding propio.',
    },
    {
      question: '¿Qué materiales se pueden consultar desde la página?',
      answer:
        'La página pública reúne cast, episodios, sketchbook, press kit y acceso al reveal. La biblia general se mantiene privada bajo solicitud.',
    },
    {
      question: '¿Cómo se solicita la biblia de la serie?',
      answer:
        'La biblia se solicita desde el popup de acceso privado o escribiendo a flardop44@gmail.com para recibir el documento de forma directa.',
    },
  ]);

  return (
    <>
      <StructuredData
        id="retroville-schema"
        data={[retrovilleSchema, retrovilleSeriesSchema, retrovilleBreadcrumbs, retrovilleFaq]}
      />
      <RetrovilleStudioEntry
        launchIso={launchIso}
        launchLabel={launchLabel}
        waitlistCount={waitlistCount}
        initialMobileExperience={initialMobileExperience}
      />
    </>
  );
}
