import CreatorExperience from '@/components/creator/CreatorExperience';
import StructuredData from '@/components/StructuredData';
import { buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata = buildPageMetadata({
  title: 'Joel Rivera Rodriguez — Creador de AdvancedRetro',
  description:
    'Portfolio online de Joel Rivera Rodriguez: UX/UI & Web Designer, developer y creador de AdvancedRetro.es y Retroville.',
  path: '/creator',
  keywords: [
    'Joel Rivera Rodriguez',
    'portfolio UX/UI designer',
    'web designer portfolio',
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
    description:
      'Portfolio online de Joel Rivera Rodriguez: UX/UI & Web Designer, developer y creador de AdvancedRetro.es y Retroville.',
    image: absoluteUrl('/images/creator/joel-color.jpg'),
    url: absoluteUrl('/creator'),
    email: 'mailto:flardop44@gmail.com',
    telephone: '+34 690 380 559',
    sameAs: [
      'https://www.linkedin.com/in/joel-rivera-rodriguez-7140a6334/',
      'https://www.instagram.com/joel_riiveraa/',
      'https://www.twitch.tv/flardop',
      'https://www.youtube.com/@JoelGamer44',
      'https://www.kickstarter.com/profile/1318310768',
      'https://flardop44.wixsite.com/portafolio-joel/acerca-de',
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'AdvancedRetro.es',
      url: absoluteUrl('/'),
    },
    knowsAbout: [
      'UX/UI Design',
      'Web Development',
      'Next.js',
      'WordPress',
      'Wix',
      'E-commerce',
      'Storytelling',
      'Narrative design',
      'Creative direction',
    ],
  };

  return (
    <>
      <StructuredData id="creator-person-schema" data={personSchema} />
      <CreatorExperience />
    </>
  );
}
