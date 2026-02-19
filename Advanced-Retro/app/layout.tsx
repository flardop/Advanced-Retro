import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { absoluteUrl, getSiteUrl } from '@/lib/siteConfig';

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

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
    default: 'AdvancedRetro.es | Tienda de juegos retro y coleccionismo',
    template: '%s | AdvancedRetro.es',
  },
  description:
    'Compra juegos retro, consolas y cajas de colección. Catálogo para Game Boy, Game Boy Color, Game Boy Advance, Super Nintendo y GameCube.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  keywords: [
    'tienda retro',
    'juegos game boy',
    'game boy color',
    'game boy advance',
    'super nintendo',
    'gamecube',
    'coleccionismo videojuegos',
    'advanced retro',
  ],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
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
      }
    : undefined,
  openGraph: {
    title: 'AdvancedRetro.es',
    description:
      'Tienda de retro gaming: juegos, consolas, cajas y componentes para completar tu colección.',
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
      'Tienda de retro gaming: juegos, consolas, cajas y componentes para completar tu colección.',
    images: [absoluteUrl('/logo.png')],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdvancedRetro.es',
    url: siteUrl,
    logo: absoluteUrl('/logo.png'),
    sameAs: [],
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

  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body">
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#11131a',
              color: '#f5f7ff',
              border: '1px solid #24283a',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
