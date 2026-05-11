import type { Metadata } from 'next';
import MysteryRoulette from '@/components/sections/MysteryRoulette';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'Ruleta de mystery tickets',
  description:
    'Usa tus tickets de mystery box en la ruleta de AdvancedRetro.es y descubre qué premio te toca en cada caja activa.',
  path: '/ruleta',
  keywords: ['ruleta retro', 'mystery box retro', 'tickets mystery'],
});

export default function RoulettePage() {
  return <MysteryRoulette />;
}
