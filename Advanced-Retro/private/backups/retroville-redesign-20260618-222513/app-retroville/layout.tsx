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
      { url: '/retroville/icon?size=16', sizes: '16x16', type: 'image/png' },
      { url: '/retroville/icon?size=32', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/retroville/icon?size=32',
    apple: [{ url: '/retroville/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RetrovilleLayout({ children }: { children: React.ReactNode }) {
  return <RetrovilleShellClient>{children}</RetrovilleShellClient>;
}
