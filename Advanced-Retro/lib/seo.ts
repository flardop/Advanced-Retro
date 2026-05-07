import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteConfig';

// Central SEO copy. Edita estos textos para ajustar posicionamiento sin tocar lógica.
export const SEO_BRAND_NAME = 'AdvancedRetro.es';
export const SEO_DEFAULT_IMAGE = '/logo.png';
export const SEO_DEFAULT_TITLE = 'AdvancedRetro | Tienda de Videojuegos y Consolas Retro';
export const SEO_DEFAULT_DESCRIPTION =
  'Compra consolas retro, videojuegos clásicos y coleccionables. Game Boy, SNES, GameCube y más, con envío a toda España.';

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
  'mystery box gaming',
  'coleccionables gaming',
  'advanced retro',
];

const TITLE_MAX = 68;
const DESCRIPTION_MAX = 170;

function cleanText(value: string): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampText(value: string, max: number): string {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function normalizeSeoTokens(value: string): string {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferSeoProductLead(input: { name: string; category?: string; platform?: string; shortDescription?: string }) {
  const source = normalizeSeoTokens(
    `${input.name} ${input.category || ''} ${input.platform || ''} ${input.shortDescription || ''}`
  );

  if (source.includes('protector') && (source.includes('caja') || source.includes('box'))) {
    return 'Protector para caja retro orientado a coleccionismo, conservación y exposición.';
  }
  if (source.includes('protector') && (source.includes('juego') || source.includes('cartucho') || source.includes('game'))) {
    return 'Protector para juego retro pensado para conservar cartucho, funda o edición suelta.';
  }
  if (source.includes('manual')) {
    return 'Manual retro para completar edición, colección o reposición de contenido original.';
  }
  if (source.includes('insert') || source.includes('inlay') || source.includes('interior')) {
    return 'Insert interior para completar presentación y conservación de una edición retro.';
  }
  if (source.includes('caja') || source.includes('box')) {
    return 'Caja retro orientada a completar juegos y mejorar el valor de colección.';
  }
  if (source.includes('consola') || source.includes('console') || source.includes('hardware')) {
    return 'Consola retro para colección, exposición o juego dentro del catálogo verificado de AdvancedRetro.es.';
  }
  return 'Artículo retro de coleccionismo revisado para catálogo, compatibilidad y disponibilidad.';
}

function uniqueKeywords(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const entry of values) {
    const clean = cleanText(entry).toLowerCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    output.push(clean);
  }
  return output;
}

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
  const title = clampText(input.title, TITLE_MAX);
  const description = clampText(input.description, DESCRIPTION_MAX);
  const keywords = uniqueKeywords([...SEO_BASE_KEYWORDS, ...(input.keywords || [])]);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'es-ES': canonicalPath,
        'x-default': canonicalPath,
      },
    },
    keywords,
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
      title,
      description,
      url: canonicalPath,
      siteName: SEO_BRAND_NAME,
      type,
      locale: 'es_ES',
      images: [
        {
          url: absoluteUrl(image),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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

export function buildItemListJsonLd(
  items: Array<{ name: string; path: string; image?: string; description?: string }>,
  listName = 'Listado'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(item.path),
      name: cleanText(item.name),
      image: item.image ? absoluteUrl(item.image) : undefined,
      description: item.description ? clampText(item.description, 160) : undefined,
    })),
  };
}

export function buildCollectionPageJsonLd(input: {
  name: string;
  path: string;
  description: string;
  image?: string;
  about?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cleanText(input.name),
    url: absoluteUrl(input.path),
    description: clampText(input.description, 240),
    image: input.image ? absoluteUrl(input.image) : undefined,
    about: (input.about || [])
      .map((entry) => cleanText(entry))
      .filter(Boolean)
      .map((entry) => ({
        '@type': 'Thing',
        name: entry,
      })),
  };
}

export function buildDiscussionForumPostingJsonLd(input: {
  title: string;
  body: string;
  path: string;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  discussionLabel?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: clampText(input.title, 110),
    articleBody: cleanText(input.body),
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt || input.publishedAt,
    author: {
      '@type': 'Person',
      name: cleanText(input.authorName) || 'Coleccionista',
    },
    about: input.discussionLabel
      ? {
          '@type': 'Thing',
          name: cleanText(input.discussionLabel),
        }
      : undefined,
  };
}

export function buildProductSeoDescription(input: {
  name: string;
  shortDescription?: string;
  category?: string;
  platform?: string;
  priceCents?: number;
  stock?: number;
}) {
  const parts: string[] = [];
  const name = cleanText(input.name);
  const category = cleanText(input.category || '');
  const platform = cleanText(input.platform || '');
  const short = cleanText(input.shortDescription || '');
  const price = Number(input.priceCents || 0);
  const stock = Number(input.stock || 0);
  const descriptiveCopy =
    short.length >= 70
      ? short
      : [
          short,
          inferSeoProductLead(input),
          platform ? `Plataforma: ${platform}.` : '',
          category ? `Categoría: ${category}.` : '',
        ]
          .filter(Boolean)
          .join(' ');

  if (name) parts.push(name);
  if (platform) parts.push(platform);
  if (category) parts.push(category);
  if (descriptiveCopy) parts.push(descriptiveCopy);
  if (price > 0) parts.push(`Precio: ${(price / 100).toFixed(2)}€`);
  if (stock > 0) parts.push(`Stock disponible: ${stock}`);
  if (stock <= 0) parts.push('Sin stock temporal');

  return clampText(parts.join(' · '), DESCRIPTION_MAX);
}
