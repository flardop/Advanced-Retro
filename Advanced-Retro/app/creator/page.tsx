import CreatorExperience from '@/components/creator/CreatorExperience';
import StructuredData from '@/components/StructuredData';
import { buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata = buildPageMetadata({
  title: 'Joel Rivera Rodriguez — Creador de AdvancedRetro',
  description: 'UX/UI Designer y Developer. Creador de AdvancedRetro.es y el universo Retroville.',
  path: '/creator',
  keywords: [
    'Joel Rivera Rodriguez',
    'UX/UI designer',
    'developer portfolio',
    'AdvancedRetro creator',
    'Retroville',
  ],
  image: '/images/creator/joel-color.jpg',
});

export default function CreatorPage() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Joel Rivera Rodriguez',
    jobTitle: 'UX/UI & Web Designer · Developer · Creator',
    description: 'UX/UI Designer y Developer. Creador de AdvancedRetro.es y el universo Retroville.',
    image: absoluteUrl('/images/creator/joel-color.jpg'),
    url: absoluteUrl('/creator'),
    sameAs: ['https://flardop44.wixsite.com/portafolio-joel'],
    worksFor: {
      '@type': 'Organization',
      name: 'AdvancedRetro.es',
      url: absoluteUrl('/'),
    },
  };

  return (
    <>
      <StructuredData id="creator-person-schema" data={personSchema} />
      <CreatorExperience />
    </>
  );
}
