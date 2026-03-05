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

  return (
    <nav className="container max-w-full flex flex-row items-center">
      <Logo></Logo>
        <div className="hidden md:flex flex-1 items-center gap-4">
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
          
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={handleClick} className="bg-blue-500 text-white hover:bg-blue-700">
            Sign Up
          </Button>
          <Button variant="ghost" onClick={handleClick}>
            Log In
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded hover:bg-gray-200 mr-4">
            <CircleUserRound className="h-max w-max" />
          </div>
        </div>
    </nav>
  );
}
