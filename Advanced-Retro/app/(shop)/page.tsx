import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Collections from '@/components/sections/Collections';
import Benefits from '@/components/sections/Benefits';
import RetroStory from '@/components/sections/RetroStory';
import FinalCTA from '@/components/sections/FinalCTA';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

type HomePageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const hasAdminFlag =
    typeof resolvedSearchParams === 'object' &&
    resolvedSearchParams !== null &&
    Object.prototype.hasOwnProperty.call(resolvedSearchParams, 'admin');

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
