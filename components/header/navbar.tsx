'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleUserRound, Plus } from 'lucide-react';
import Logo from './logo';

export default function Navbar() {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 200;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="container flex max-w-full flex-row items-center">
      <Logo></Logo>
      <div className="hidden flex-1 items-center gap-4 md:flex">
        <Button variant="ghost" onClick={() => scrollToSection('discover')}>
          Discover
        </Button>
        <Button variant="ghost" onClick={() => scrollToSection('learn')}>
          Learn
        </Button>
        <div className="flex flex-row">
          <Button variant="ghost" onClick={() => scrollToSection('create')}>
            Create <Plus />
          </Button>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <a href="/register">
          <Button
            onClick={handleClick}
            className="bg-blue-500 text-white hover:bg-blue-700"
          >
            Register
          </Button>
        </a>
        <a href="/login">
          <Button variant="ghost" onClick={handleClick}>
            Log In
          </Button>
        </a>
        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded hover:bg-gray-200">
          <CircleUserRound className="h-max w-max" />
        </div>
      </div>
    </nav>
  );
}
