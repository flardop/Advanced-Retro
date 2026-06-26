import type { Metadata } from 'next';
import RetrovilleShellClient from '@/components/retroville/RetrovilleShellClient';
import { RETROVILLE_GOOGLE_SITE_VERIFICATION } from '@/app/retroville/shared';

export const metadata: Metadata = {
  category: 'entertainment',
  manifest: '/retroville/manifest.webmanifest',
  verification: {
    google: RETROVILLE_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RetrovilleLayout({ children }: { children: React.ReactNode }) {
  return <RetrovilleShellClient>{children}</RetrovilleShellClient>;
}
