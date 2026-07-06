import { stat } from 'fs/promises';
import { join } from 'path';
import { getSiteUrl } from '@/lib/siteConfig';

export type RetrovillePageRegistryEntry = {
  path: string;
  label: string;
  seoTitle: string;
  metaDescription: string;
  canonical: string;
  structuredDataTypes: string[];
  noIndex?: boolean;
  sourceFile?: string | null;
  published?: boolean;
};

const siteUrl = getSiteUrl();

const PAGE_REGISTRY: RetrovillePageRegistryEntry[] = [
  {
    path: '/retroville',
    label: 'Home',
    seoTitle: 'Retroville | Serie animada original y material de pitch',
    metaDescription:
      'Retroville es una serie animada original con cast, worldbuilding, T1, press kit y biblia privada para buyers, partners y medios.',
    canonical: `${siteUrl}/retroville`,
    structuredDataTypes: ['CollectionPage', 'TVSeries', 'FAQPage'],
    sourceFile: 'app/retroville/page.tsx',
    published: true,
  },
  {
    path: '/retroville/personajes',
    label: 'Personajes',
    seoTitle: 'Personajes de Retroville | Cast principal y vecinos',
    metaDescription:
      'Descubre los personajes principales de Retroville, sus roles, tono y presencia dentro del universo de la serie.',
    canonical: `${siteUrl}/retroville/personajes`,
    structuredDataTypes: ['CollectionPage', 'TVSeries'],
    sourceFile: 'app/retroville/personajes/page.tsx',
    published: true,
  },
  {
    path: '/retroville/sketches',
    label: 'Sketches',
    seoTitle: 'Sketchbook de Retroville | Archivo visual del proceso',
    metaDescription:
      'Archivo de sketches, mapas, distritos y visual development de Retroville para enseñar cómo nace el universo antes de su versión final.',
    canonical: `${siteUrl}/retroville/sketches`,
    structuredDataTypes: ['CollectionPage'],
    sourceFile: 'app/retroville/sketches/page.tsx',
    published: true,
  },
  {
    path: '/retroville/episodios',
    label: 'Episodios',
    seoTitle: 'Episodios privados de Retroville | Acceso editorial',
    metaDescription:
      'Acceso editorial privado a los episodios de Retroville. La estructura completa de la temporada se solicita por correo para mantener la exclusividad del proyecto.',
    canonical: `${siteUrl}/retroville/episodios`,
    structuredDataTypes: ['CollectionPage', 'TVSeries'],
    noIndex: true,
    sourceFile: 'app/retroville/episodios/page.tsx',
    published: true,
  },
  {
    path: '/retroville/presentaciones',
    label: 'Presentaciones',
    seoTitle: 'Presentación de Retroville | Pitch visual del universo',
    metaDescription:
      'Presentación visual de Retroville para buyers, prensa y partners, con enfoque rápido en universo, personajes y propuesta de serie.',
    canonical: `${siteUrl}/retroville/presentaciones`,
    structuredDataTypes: ['CollectionPage', 'TVSeries'],
    sourceFile: 'app/retroville/presentaciones/page.tsx',
    published: true,
  },
  {
    path: '/retroville/press',
    label: 'Press',
    seoTitle: 'Press kit de Retroville | Logos, renders y dossier oficial',
    metaDescription:
      'Accede al press kit oficial de Retroville con logotipo, renders de personajes y solicitud privada de la biblia base para prensa, creadores y medios.',
    canonical: `${siteUrl}/retroville/press`,
    structuredDataTypes: ['CollectionPage', 'TVSeries'],
    sourceFile: 'app/retroville/press/page.tsx',
    published: true,
  },
  {
    path: '/retroville/faq',
    label: 'FAQ',
    seoTitle: 'FAQ de Retroville | Preguntas y respuestas del proyecto',
    metaDescription:
      'Preguntas frecuentes sobre Retroville, su lanzamiento, materiales públicos, biblia privada y próximos pasos del proyecto.',
    canonical: `${siteUrl}/retroville/faq`,
    structuredDataTypes: ['FAQPage', 'CollectionPage'],
    sourceFile: 'app/retroville/faq/page.tsx',
    published: true,
  },
  {
    path: '/retroville/lore',
    label: 'Lore',
    seoTitle: 'Lore de Retroville | Estado pendiente',
    metaDescription:
      'Página reservada para el lore expandido de Retroville. Actualmente no está publicada como sección independiente.',
    canonical: `${siteUrl}/retroville/lore`,
    structuredDataTypes: [],
    published: false,
  },
  {
    path: '/retroville/distritos',
    label: 'Distritos',
    seoTitle: 'Distritos de Retroville | Estado pendiente',
    metaDescription:
      'Página reservada para los distritos de Retroville. Actualmente no está publicada como sección independiente.',
    canonical: `${siteUrl}/retroville/distritos`,
    structuredDataTypes: [],
    published: false,
  },
  {
    path: '/retroville/comunidad',
    label: 'Comunidad',
    seoTitle: 'Comunidad de Retroville | Archivo social y fandom',
    metaDescription:
      'Archivo social y fandom oficial de Retroville con señales, hashtags y publicaciones para activar comunidad alrededor del proyecto.',
    canonical: `${siteUrl}/retroville/comunidad`,
    structuredDataTypes: ['CollectionPage'],
    sourceFile: 'app/retroville/comunidad/page.tsx',
    published: true,
  },
  {
    path: '/retroville/legal',
    label: 'Legal',
    seoTitle: 'Legal de Retroville | Términos y derechos del proyecto',
    metaDescription:
      'Información legal y de uso sobre los materiales públicos y privados del proyecto Retroville.',
    canonical: `${siteUrl}/retroville/legal`,
    structuredDataTypes: ['WebPage'],
    sourceFile: 'app/retroville/legal/page.tsx',
    published: true,
  },
  {
    path: '/retroville/admin',
    label: 'Admin',
    seoTitle: 'Retroville Admin | Acceso privado',
    metaDescription: 'Panel privado del creador para controlar analíticas, usuarios, SEO, contenido y errores de Retroville.',
    canonical: `${siteUrl}/retroville/admin`,
    structuredDataTypes: [],
    noIndex: true,
    sourceFile: 'app/retroville/admin/page.tsx',
    published: true,
  },
];

export async function getRetrovillePageRegistry() {
  return Promise.all(
    PAGE_REGISTRY.map(async (entry) => {
      if (!entry.sourceFile) {
        return {
          ...entry,
          lastModified: null as string | null,
        };
      }

      try {
        const filePath = join(process.cwd(), entry.sourceFile);
        const fileStat = await stat(filePath);
        return {
          ...entry,
          lastModified: fileStat.mtime.toISOString(),
        };
      } catch {
        return {
          ...entry,
          lastModified: null as string | null,
        };
      }
    })
  );
}

export function isRetrovillePageInSitemap(path: string) {
  return [
    '/retroville',
    '/retroville/comunidad',
    '/retroville/episodios',
    '/retroville/faq',
    '/retroville/legal',
    '/retroville/personajes',
    '/retroville/press',
    '/retroville/presentaciones',
    '/retroville/sketches',
  ].includes(path);
}

export function isRetrovillePageAllowedByRobots(path: string) {
  if (path.startsWith('/retroville/admin')) return false;
  return true;
}
