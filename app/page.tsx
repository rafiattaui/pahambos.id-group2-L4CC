import HeroSect from '@/components/Hero/herosect';
import Navbar from '@/components/header/navbar';
import Discover from '@/components/landing/discover';
import Learn from '@/components/landing/learn';
import Create from '@/components/landing/create';
import FadeInSection from '@/components/animation/fade-in-section';

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-md">
        <Navbar sections={['Discover', 'Learn', 'Create']} />
      </header>

      <HeroSect />

      <FadeInSection>
        <Discover />
      </FadeInSection>

      <FadeInSection direction="left">
        <Learn />
      </FadeInSection>

      <FadeInSection direction="right">
        <Create />
      </FadeInSection>
    </div>
  );
}
