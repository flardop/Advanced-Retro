import type { Metadata } from 'next';
import MysteryRoulette from '@/components/sections/MysteryRoulette';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'Ruleta retro y mystery tickets',
  description:
    'Gira la ruleta de AdvancedRetro.es con tickets de mystery box y descubre premios disponibles por caja activa.',
  path: '/ruleta',
  keywords: ['ruleta retro', 'mystery box retro', 'tickets mystery'],
});

export default function RoulettePage() {
  return <MysteryRoulette />;
}
