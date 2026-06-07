import type { Metadata } from 'next';
import RetrovillePitchLab from '@/components/retroville/RetrovillePitchLab';
import StructuredData from '@/components/StructuredData';
import { buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata: Metadata = buildPageMetadata({
  title: 'Retroville Pitch Lab | 5 tratamientos creativos',
  description:
    'Cinco presentaciones alternativas de Retroville con enfoque de pitch de estudio: serie, personajes, worldbuilding y estilo visual sin tocar la experiencia principal.',
  path: '/retroville/presentaciones',
  keywords: [
    'retroville pitch lab',
    'retroville presentaciones',
    'retroville serie animada',
    'retroville personajes',
    'retroville worldbuilding',
    'retroville bible',
  ],
  image: '/images/retroville/retroville-cast-presentation.png',
});

export default function RetrovillePresentacionesPage() {
  const presentationSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Retroville Pitch Lab',
    url: absoluteUrl('/retroville/presentaciones'),
    description:
      'Laboratorio de cinco tratamientos creativos para presentar el universo Retroville con distintos enfoques de pitch de estudio.',
    image: absoluteUrl('/images/retroville/retroville-cast-presentation.png'),
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: 'Retroville',
      url: absoluteUrl('/retroville'),
    },
  };

  return (
    <>
      <StructuredData id="retroville-pitch-lab-schema" data={presentationSchema} />
      <RetrovillePitchLab />
    </>
  );
}
