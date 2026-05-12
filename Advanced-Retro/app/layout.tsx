import type { Metadata } from 'next';
import '../styles/globals.css';
import Script from 'next/script';
import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';
import { LocaleProvider } from '@/components/LocaleProvider';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import StoreChromeShell from '@/components/StoreChromeShell';
import { absoluteUrl, getSiteUrl } from '@/lib/siteConfig';
import { SEO_BASE_KEYWORDS, SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from '@/lib/seo';
import {
  LEGAL_CITY,
  LEGAL_COUNTRY,
  LEGAL_REGION,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_SUPPORT_EMAIL,
} from '@/lib/legal';

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const contactEmail = PUBLIC_SUPPORT_EMAIL;
const contactPhone = PUBLIC_CONTACT_PHONE;
const socialProfiles = String(process.env.NEXT_PUBLIC_SOCIAL_PROFILES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const displayFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
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
    title: 'AdvancedRetro.es',
    description:
      'Compra consolas retro, videojuegos clásicos y coleccionables. Game Boy, SNES, GameCube y más.',
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
    title: 'AdvancedRetro.es',
    description:
      'Compra consolas retro, videojuegos clásicos y coleccionables. Game Boy, SNES, GameCube y más.',
    images: [absoluteUrl('/logo.png')],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdvancedRetro.es',
    url: siteUrl,
    logo: absoluteUrl('/logo.png'),
    email: contactEmail,
    telephone: contactPhone || undefined,
    sameAs: socialProfiles,
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AdvancedRetro.es',
    url: siteUrl,
    potentialAction: {
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
    availableLanguage: ['es-ES', 'en'],
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
        availableLanguage: ['es', 'en'],
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

  return (
    <html lang="es" data-site-theme="steam-market" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body min-h-screen flex flex-col overflow-x-hidden">
        <GlobalErrorBoundary>
          <LocaleProvider>
            <Script
              id="schema-org"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify([organizationSchema, websiteSchema, onlineStoreSchema, localBusinessSchema]),
              }}
            />
            <StoreChromeShell>{children}</StoreChromeShell>
          </LocaleProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
