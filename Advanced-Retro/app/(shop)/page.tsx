import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Collections from '@/components/sections/Collections';
import Benefits from '@/components/sections/Benefits';
import RetroStory from '@/components/sections/RetroStory';
import FinalCTA from '@/components/sections/FinalCTA';

export default function HomePage() {
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
