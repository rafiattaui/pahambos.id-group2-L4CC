'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { Plus, Search } from 'lucide-react';
import { dashboardHref } from '@/app/dashboard/layout';
import Logo from '../header/logo';

export default function DashNavbar() {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };

  return (
    <nav className="flex w-full flex-row items-center">
      <Logo></Logo>
      <div className="hidden flex-1 justify-center md:flex">
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon align={'inline-start'}>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." />
        </InputGroup>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={dashboardHref('create')}
          className="flex flex-row rounded-md transition-[transform,background-color] duration-200 hover:border-2 active:translate-y-1 active:bg-gray-400"
        >
          <Button className="bg-transparent text-black hover:bg-transparent">
            Create <Plus />
          </Button>
        </Link>
        <Link href={dashboardHref('profile')}>
          <Avatar className="mr-4 h-10 w-10 cursor-pointer rounded-full hover:brightness-75">
            <AvatarImage src="/avatar_placeholder.jpg" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </nav>
  );
}
