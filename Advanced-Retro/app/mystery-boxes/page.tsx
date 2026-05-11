import type { Metadata } from 'next';
import MysteryBoxesHub from '@/components/sections/MysteryBoxesHub';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'Mystery Boxes retro',
  description:
    'Descubre todas las cajas mystery activas de AdvancedRetro.es, compara tiers y compra tu próxima tirada.',
  path: '/mystery-boxes',
  keywords: ['mystery box retro', 'cajas misteriosas retro', 'advanced retro mystery'],
});

export default function MysteryBoxesPage() {
  return <MysteryBoxesHub />;
}
