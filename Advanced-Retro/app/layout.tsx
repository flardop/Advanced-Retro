import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import '../styles/retroville.css';
import '../styles/z-index.css';
import { LocaleProvider } from '@/components/LocaleProvider';
import GlobalPageTranslator from '@/components/GlobalPageTranslator';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import StructuredData from '@/components/StructuredData';
import StoreChromeShell from '@/components/StoreChromeShell';
import { absoluteUrl, getSiteUrl, isRetrovilleStandalone } from '@/lib/siteConfig';
import { SEO_BASE_KEYWORDS, SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from '@/lib/seo';
import { siteBodyFont, siteDisplayFont, siteMonoFont } from '@/lib/siteFonts';
import {
  LEGAL_CITY,
  LEGAL_COUNTRY,
  LEGAL_REGION,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_SUPPORT_EMAIL,
} from '@/lib/legal';

const siteUrl = getSiteUrl();
const retrovilleStandalone = isRetrovilleStandalone();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const contactEmail = PUBLIC_SUPPORT_EMAIL;
const contactPhone = PUBLIC_CONTACT_PHONE;
const socialProfiles = String(process.env.NEXT_PUBLIC_SOCIAL_PROFILES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const displayFont = siteDisplayFont;
const bodyFont = siteBodyFont;
const monoFont = siteMonoFont;

const storeMetadata: Metadata = {
  title: {
    default: SEO_DEFAULT_TITLE,
    template: '%s | AdvancedRetro.es',
  },
  description: SEO_DEFAULT_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/',
      'x-default': '/',
    },
  },
  creator: 'AdvancedRetro.es',
  publisher: 'AdvancedRetro.es',
  applicationName: 'AdvancedRetro.es',
  manifest: '/manifest.webmanifest',
  category: 'shopping',
  keywords: SEO_BASE_KEYWORDS,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  robots: {
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
  verification: googleVerification
    ? {
        google: googleVerification,
        other: bingVerification
          ? {
              'msvalidate.01': bingVerification,
            }
          : undefined,
      }
    : bingVerification
      ? {
          other: {
            'msvalidate.01': bingVerification,
          },
        }
      : undefined,
  openGraph: {
    title: 'AdvancedRetro.es | Tienda Retro Online',
    description:
      'Compra consolas retro, videojuegos clásicos y coleccionables. Game Boy, SNES, Mega Drive, PlayStation y más.',
    url: siteUrl,
    siteName: 'AdvancedRetro.es',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: absoluteUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'AdvancedRetro.es',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdvancedRetro.es | Tienda Retro Online',
    description:
      'Compra consolas retro, videojuegos clásicos y coleccionables. Game Boy, SNES, Mega Drive, PlayStation y más.',
    images: [absoluteUrl('/logo.png')],
  },
};

const retrovilleMetadata: Metadata = {
  title: {
    default: 'Retroville | Serie animada original',
    template: '%s | Retroville',
  },
  description:
    'Retroville es una serie animada original con personajes, worldbuilding, episodios y materiales de presentación.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/',
      'x-default': '/',
    },
  },
  creator: 'Retroville',
  publisher: 'Retroville',
  applicationName: 'Retroville',
  manifest: '/manifest.webmanifest',
  category: 'entertainment',
  keywords: [
    'Retroville',
    'serie animada original',
    'animación',
    'comedia negra',
    'ciencia ficción retro',
    'worldbuilding',
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/retroville/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/retroville/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/icons/retroville/apple-touch-icon.png',
    shortcut: '/icons/retroville/favicon-32.png',
  },
  robots: {
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
    title: 'Retroville | Serie animada original',
    description:
      'Una ciudad donde el hardware olvidado sigue vivo entre humor oscuro, barrio y caos social.',
    url: siteUrl,
    siteName: 'Retroville',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: absoluteUrl('/images/retroville/retroville-cast-presentation.png'),
        width: 1200,
        height: 630,
        alt: 'Retroville',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retroville | Serie animada original',
    description:
      'Una ciudad donde el hardware olvidado sigue vivo entre humor oscuro, barrio y caos social.',
    images: [absoluteUrl('/images/retroville/retroville-cast-presentation.png')],
  },
};

export const metadata: Metadata = retrovilleStandalone
  ? retrovilleMetadata
  : storeMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandName = retrovilleStandalone ? 'Retroville' : 'AdvancedRetro.es';
  const brandLogo = retrovilleStandalone
    ? absoluteUrl('/images/retroville/retroville-logo.webp')
    : absoluteUrl('/logo.png');
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName,
    url: siteUrl,
    logo: brandLogo,
    email: retrovilleStandalone ? undefined : contactEmail,
    telephone: retrovilleStandalone ? undefined : contactPhone || undefined,
    sameAs: retrovilleStandalone ? undefined : socialProfiles,
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brandName,
    url: siteUrl,
    potentialAction: retrovilleStandalone
      ? undefined
      : {
          '@type': 'SearchAction',
          target: `${siteUrl}/tienda?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
  };

  const onlineStoreSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'AdvancedRetro.es',
    url: siteUrl,
    image: absoluteUrl('/logo.png'),
    description:
      'Tienda online retro en España especializada en juegos, consolas y coleccionismo para Game Boy, GBC, GBA, SNES y GameCube.',
    email: contactEmail,
    telephone: contactPhone || undefined,
    currenciesAccepted: 'EUR',
    paymentAccepted: ['Card', 'Apple Pay', 'Google Pay'],
    areaServed: {
      '@type': 'Country',
      name: 'Spain',
    },
    availableLanguage: ['es-ES', 'en', 'fr', 'it', 'de', 'pt'],
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'ES',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: contactEmail,
        telephone: contactPhone || undefined,
        availableLanguage: ['es', 'en', 'fr', 'it', 'de', 'pt'],
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'AdvancedRetro.es',
    url: siteUrl,
    image: absoluteUrl('/logo.png'),
    email: contactEmail,
    telephone: contactPhone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: LEGAL_COUNTRY || 'ES',
      addressLocality: LEGAL_CITY || undefined,
      addressRegion: LEGAL_REGION || undefined,
    },
  };

  const structuredData = retrovilleStandalone
    ? [organizationSchema, websiteSchema]
    : [organizationSchema, websiteSchema, onlineStoreSchema, localBusinessSchema];

  return (
    <html lang="es" data-site-theme="steam-market" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body min-h-screen flex flex-col overflow-x-hidden">
        <GlobalErrorBoundary>
          <LocaleProvider>
            <StructuredData
              id="schema-org"
              data={structuredData}
            />
            <GlobalPageTranslator />
            <StoreChromeShell>{children}</StoreChromeShell>
          </LocaleProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
