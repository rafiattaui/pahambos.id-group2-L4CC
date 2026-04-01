'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleUserRound, Plus } from 'lucide-react';
import Logo2 from './logo2';
import Link from 'next/link';

export default function NavbarLogin() {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };

  return (
    <nav className="flex w-full flex-row items-center justify-center">
      <Link href="/">
        <Logo2 />
      </Link>
    </nav>
  );
}
