'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from './logo';
import Link from 'next/link';

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
    <nav className="flex flex-row">
      <Link href="/">
        <Logo />
      </Link>

      <div className="font-body-bold hidden flex-1 flex-row items-center-safe md:flex">
        <Button variant="ghost" onClick={handleClick}>
          Discover
        </Button>
        <Button variant="ghost" onClick={handleClick}>
          Learn
        </Button>
        <div className="flex flex-row">
          <Button variant="ghost" onClick={handleClick}>
            Create <Plus />
          </Button>
        </div>
        <div className="ml-auto flex flex-row items-center gap-2">
          <Button
            onClick={handleClick}
            className="bg-blue-500 text-white hover:bg-blue-700"
          >
            Sign Up
          </Button>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <a href="/register" className="">
          <Button
            onClick={handleClick}
            className="bg-blue-500 text-white hover:bg-blue-700"
          >
            Register
          </Button>
        </a>
        <a href="/login" className="hidden sm:inline-block">
          <Button variant="ghost" onClick={handleClick}>
            Log In
          </Button>
          <div className="mr-4 ml-auto flex h-10 w-10 items-center justify-center rounded hover:bg-gray-200">
            <CircleUserRound className="h-max w-max" />
          </div>
        </div>
      </div>
    </nav>
  );
}
