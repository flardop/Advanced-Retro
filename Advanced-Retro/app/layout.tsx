import type { Metadata } from 'next';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LocaleProvider } from '@/components/LocaleProvider';
import { absoluteUrl, getSiteUrl } from '@/lib/siteConfig';
import { SEO_BASE_KEYWORDS, SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from '@/lib/seo';

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const SupportAssistantWidget = dynamic(() => import('@/components/SupportAssistantWidget'), {
  ssr: false,
});
const LanguageSwitcherPopup = dynamic(() => import('@/components/LanguageSwitcherPopup'), {
  ssr: false,
});
const ClientToaster = dynamic(() => import('@/components/ClientToaster'), {
  ssr: false,
});

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
  },
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
        <LocaleProvider>
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
          <ClientToaster />
          <SupportAssistantWidget />
          <LanguageSwitcherPopup />
          <Analytics />
        </LocaleProvider>
      </body>
    </html>
  );
}
