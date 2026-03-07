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

  if (name) parts.push(name);
  if (platform) parts.push(platform);
  if (category) parts.push(category);
  if (short) parts.push(short);
  if (price > 0) parts.push(`Precio: ${(price / 100).toFixed(2)}€`);
  if (stock > 0) parts.push(`Stock disponible: ${stock}`);
  if (stock <= 0) parts.push('Sin stock temporal');

  return clampText(parts.join(' · '), DESCRIPTION_MAX);
}
