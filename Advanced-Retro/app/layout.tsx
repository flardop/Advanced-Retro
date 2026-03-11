import type { Metadata } from 'next';
import '../styles/globals.css';
import Script from 'next/script';
import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LocaleProvider } from '@/components/LocaleProvider';
import { absoluteUrl, getSiteUrl } from '@/lib/siteConfig';
import { SEO_BASE_KEYWORDS, SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from '@/lib/seo';
import { DEFAULT_SITE_THEME, SITE_THEME_IDS } from '@/lib/siteThemes';

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@advancedretro.es';
const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '';
const socialProfiles = String(process.env.NEXT_PUBLIC_SOCIAL_PROFILES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const SupportAssistantWidget = dynamic(() => import('@/components/SupportAssistantWidget'), {
  ssr: false,
});
const LanguageSwitcherPopup = dynamic(() => import('@/components/LanguageSwitcherPopup'), {
  ssr: false,
});
const ClientToaster = dynamic(() => import('@/components/ClientToaster'), {
  ssr: false,
});
const CookieConsentBanner = dynamic(() => import('@/components/CookieConsentBanner'), {
  ssr: false,
});
const OptionalAnalytics = dynamic(() => import('@/components/OptionalAnalytics'), {
  ssr: false,
});
const ThemeStyleMenu = dynamic(() => import('@/components/ThemeStyleMenu'), {
  ssr: false,
});
const AnimatedFavicon = dynamic(() => import('@/components/AnimatedFavicon'), {
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
  const allowedSiteThemes = JSON.stringify(SITE_THEME_IDS);
  const defaultSiteTheme = JSON.stringify(DEFAULT_SITE_THEME);
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
      addressCountry: 'ES',
      addressLocality: 'Arenys de Mar',
      addressRegion: 'Cataluña',
    },
  };

  return (
    <html lang="es" data-site-theme="steam-market" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body min-h-screen flex flex-col overflow-x-hidden">
        <LocaleProvider>
          <Script
            id="theme-bootstrap"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html:
                `(function(){try{var key='advancedretro:site-theme';var allowed=${allowedSiteThemes};var fallback=${defaultSiteTheme};var v=localStorage.getItem(key);if(v&&allowed.indexOf(v)!==-1){document.documentElement.setAttribute('data-site-theme',v);}else{document.documentElement.setAttribute('data-site-theme',fallback);}}catch(e){document.documentElement.setAttribute('data-site-theme',${defaultSiteTheme});}})();`,
            }}
          />
          <AnimatedFavicon />
          <Script
            id="schema-org"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([organizationSchema, websiteSchema, onlineStoreSchema, localBusinessSchema]),
            }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ClientToaster />
          <SupportAssistantWidget />
          <LanguageSwitcherPopup />
          <CookieConsentBanner />
          <OptionalAnalytics />
          <ThemeStyleMenu />
        </LocaleProvider>
      </body>
    </html>
  );
}
