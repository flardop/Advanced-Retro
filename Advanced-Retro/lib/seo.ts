import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteConfig';

// Central SEO copy. Edita estos textos para ajustar posicionamiento sin tocar lógica.
export const SEO_BRAND_NAME = 'AdvancedRetro.es';
export const SEO_DEFAULT_IMAGE = '/logo.png';
export const SEO_DEFAULT_TITLE = 'AdvancedRetro.es | Tienda retro de videojuegos y coleccionismo';
export const SEO_DEFAULT_DESCRIPTION =
  'Tienda retro en España con juegos, consolas y componentes de coleccionismo para Game Boy, GBC, GBA, SNES y GameCube.';

export const SEO_BASE_KEYWORDS = [
  'tienda retro',
  'juegos retro',
  'videojuegos retro',
  'coleccionismo retro',
  'game boy',
  'game boy color',
  'game boy advance',
  'super nintendo',
  'gamecube',
  'advanced retro',
];

type BuildPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
};

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const image = input.image || SEO_DEFAULT_IMAGE;
  const canonicalPath = input.path.startsWith('/') ? input.path : `/${input.path}`;
  const noIndex = Boolean(input.noIndex);
  const type = input.type || 'website';

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
    },
    keywords: [...SEO_BASE_KEYWORDS, ...(input.keywords || [])],
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            'max-snippet': -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalPath,
      siteName: SEO_BRAND_NAME,
      type,
      locale: 'es_ES',
      images: [absoluteUrl(image)],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [absoluteUrl(image)],
    },
  };
}

export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
