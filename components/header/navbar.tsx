'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authClient } from '@/lib/auth-client';
import Logo from './logo';

export default function Navbar(props: { sections: string[] }) {
  const [isClicked, setIsClicked] = useState(false);
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

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
    <nav className="flex w-full flex-row items-center">
      <Logo></Logo>
      <div className="hidden flex-1 items-center justify-center md:flex">
        {props.sections.map((section, index) => (
          <div
            key={index}
            className="flex h-14.5 w-32 items-center justify-center hover:bg-gray-200"
          >
            <Button
              variant="ghost"
              className="hover:bg-transparent"
              onClick={() => scrollToSection(section.toLowerCase())}
            >
              {section}
            </Button>
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!isAuthenticated ? (
          <>
            <a href="/profile">
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
            </a>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">
              Hi, {session?.user?.name}!
            </span>
          </>
        )}

        <Avatar className="mr-4 flex h-10 w-10 items-center justify-center rounded hover:bg-gray-200">
          <AvatarImage src="/not_logged_in_avatar.jpg" />
          <AvatarFallback>
            {isAuthenticated ? session?.user?.name?.charAt(0) : 'CN'}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
