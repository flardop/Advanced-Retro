import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Collections from '@/components/sections/Collections';
import Benefits from '@/components/sections/Benefits';
import RetroStory from '@/components/sections/RetroStory';
import FinalCTA from '@/components/sections/FinalCTA';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function HomePage({ searchParams }: HomePageProps) {
  const hasAdminFlag =
    typeof searchParams === 'object' &&
    searchParams !== null &&
    Object.prototype.hasOwnProperty.call(searchParams, 'admin');

  if (hasAdminFlag) {
    redirect('/admin');
  }

  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Collections />
      <Benefits />
      <RetroStory />
      <FinalCTA />
    </>
  );
}
