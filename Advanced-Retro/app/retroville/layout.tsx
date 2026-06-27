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
      { url: '/icons/retroville/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/retroville/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/icons/retroville/favicon-32.png',
    apple: [{ url: '/icons/retroville/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RetrovilleLayout({ children }: { children: React.ReactNode }) {
  return <RetrovilleShellClient>{children}</RetrovilleShellClient>;
}
