import HeroSect from '@/components/hero/herosect';
import Navbar from '@/components/header/navbar';
import Discover from '@/components/landing/discover';
import Learn from '@/components/landing/learn';
import Create from '@/components/landing/create';

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-md">
        <Navbar />
      </header>
      <HeroSect />
      <Discover />
      <Learn />
      <Create />
    </div>
  );
}
