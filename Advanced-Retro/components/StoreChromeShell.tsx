'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrackerBootstrap from '@/components/TrackerBootstrap';
import FloatingActionDock from '@/components/FloatingActionDock';
const ClientToaster = dynamic(() => import('@/components/ClientToaster'), {
  ssr: false,
});
const CookieConsentBanner = dynamic(() => import('@/components/CookieConsentBanner'), {
  ssr: false,
});
const OptionalAnalytics = dynamic(() => import('@/components/OptionalAnalytics'), {
  ssr: false,
});

function isStandalonePath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/retroville') ||
    pathname.startsWith('/dev-retroville')
  );
}

export default function StoreChromeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const standalone = isStandalonePath(pathname);

  if (standalone) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <TrackerBootstrap />
      </Suspense>
      <Navbar />
      <main className="flex-1 pb-24 sm:pb-28">{children}</main>
      <Footer />
      <FloatingActionDock />
      <ClientToaster />
      <CookieConsentBanner />
      <OptionalAnalytics />
    </>
  );
}
