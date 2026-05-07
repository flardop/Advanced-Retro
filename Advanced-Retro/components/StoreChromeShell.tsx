'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrackerBootstrap from '@/components/TrackerBootstrap';
const ClientToaster = dynamic(() => import('@/components/ClientToaster'), {
  ssr: false,
});
const CookieConsentBanner = dynamic(() => import('@/components/CookieConsentBanner'), {
  ssr: false,
});
const OptionalAnalytics = dynamic(() => import('@/components/OptionalAnalytics'), {
  ssr: false,
});
const AnimatedFavicon = dynamic(() => import('@/components/AnimatedFavicon'), {
  ssr: false,
});

function isStandalonePath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/retroville') || pathname.startsWith('/creador-de-tiendas');
}

export default function StoreChromeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const standalone = isStandalonePath(pathname);

  if (standalone) {
    return (
      <>
        <AnimatedFavicon />
        {children}
      </>
    );
  }

  return (
    <>
      <AnimatedFavicon />
      <Suspense fallback={null}>
        <TrackerBootstrap />
      </Suspense>
      <Navbar />
      <main className="flex-1 pb-4 lg:pb-0">{children}</main>
      <Footer />
      <ClientToaster />
      <CookieConsentBanner />
      <OptionalAnalytics />
    </>
  );
}
