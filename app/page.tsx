import HeroSect from '@/components/hero/herosect';
import Navbar from '@/components/header/navbar';

export default function Home() {
  return (
    <div>
      <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-md">
        <Navbar />
      </header>
      <HeroSect />
    </div>
  );
}
