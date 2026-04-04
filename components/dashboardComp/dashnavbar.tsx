'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { ClipboardPlus, Search, House, Users, History } from 'lucide-react';
import { dashboardHref } from '@/app/dashboard/layout';
import Logo from '../header/logo';

export default function DashNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const handleSearch = () => {
    router.push(dashboardHref(`search?q=${encodeURIComponent(query)}`));
  };
  
  return (
    <nav className="flex w-full flex-row items-center">
      <Logo></Logo>
      <div className="ml-4 hidden flex-row gap-4 md:flex">
        <Link href="/dashboard" className="flex flex-wrap items-center gap-2">
          <House className="h-5 w-5" />
          <span className="font-body-bold">Home</span>
        </Link>
        <Link
          href={dashboardHref('class')}
          className="flex flex-wrap items-center gap-2"
        >
          <Users className="h-5 w-5" />
          <span className="font-body-bold">Class</span>
        </Link>
        <Link
          href={dashboardHref('history')}
          className="flex flex-wrap items-center gap-2"
        >
          <History className="h-5 w-5" />
          <span className="font-body-bold">History</span>
        </Link>
      </div>
      <div className="hidden flex-1 justify-center md:flex">
        <InputGroup className="w-full max-w-sm" onClick={handleSearch}>
          <InputGroupAddon align={'inline-start'}>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </InputGroup>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={dashboardHref('create')}
          className="mx-4 flex h-10 flex-row items-center gap-2 rounded-md p-2 transition-[transform,background-color] duration-200 hover:border-2 active:translate-y-1 active:bg-gray-400"
        >
          <span className="font-body-bold">Create</span> <ClipboardPlus />
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
