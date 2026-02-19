import type { Metadata } from 'next';
import CommunityFeed from '@/components/sections/CommunityFeed';

export const metadata: Metadata = {
  title: 'Comunidad',
  description:
    'Marketplace de comunidad de AdvancedRetro.es: compra y venta entre coleccionistas con revisión y seguimiento.',
  alternates: {
    canonical: '/comunidad',
  },
};

export default function CommunityPage() {
  return <CommunityFeed />;
}
