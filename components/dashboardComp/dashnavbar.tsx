'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import {
  ClipboardPlus,
  Search,
  House,
  Users,
  History,
  UserCircleIcon,
  DoorOpen,
} from 'lucide-react';
import { dashboardHref } from '@/components/dashboardComp/dashboardHref';
import { authClient } from '@/lib/auth-client';
import Logo from '../header/logo';

type NavbarProps = {
  user: {
    name?: string | null;
    image?: string | null;
  } | null;
};

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Home', icon: House },
    { href: dashboardHref('search'), label: 'Search', icon: Search },
    { href: dashboardHref('class'), label: 'Class', icon: Users },
    { href: dashboardHref('history'), label: 'History', icon: History },
    { href: dashboardHref('create'), label: 'Create', icon: ClipboardPlus },
  ];

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="fixed left-1/2 z-50 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md md:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-[11px] ${
                  active ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function DashNavbar({ user }: NavbarProps) {
  const isLoggedIn = !!user;
  const avatarSrc = user?.image ?? '/avatar_placeholder.jpg';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const handleSearchSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();

    const q = query.trim();
    const href = q
      ? dashboardHref(`search?q=${encodeURIComponent(q)}`)
      : dashboardHref('search');

    router.push(href);
  };

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="flex w-full flex-row items-center">
        <Logo></Logo>
        <div className="ml-4 hidden flex-row gap-6 md:flex">
          <Link
            href="/dashboard"
            className={`flex flex-wrap items-center gap-2 transition-colors hover:text-blue-600 ${isActive('/dashboard') ? 'border-b-2 border-b-blue-600 text-blue-600' : 'text-slate-700'}`}
          >
            <House className="h-5 w-5" />
            <span className="font-body-bold">Home</span>
          </Link>
          <Link
            href={dashboardHref('class')}
            className={`flex flex-wrap items-center gap-2 transition-colors hover:text-blue-600 ${isActive(dashboardHref('class')) ? 'border-b-2 border-b-blue-600 text-blue-600' : 'text-slate-700'}`}
          >
            <Users className="h-5 w-5" />
            <span className="font-body-bold">Class</span>
          </Link>
          <Link
            href={dashboardHref('history')}
            className={`flex flex-wrap items-center gap-2 transition-colors hover:text-blue-600 ${isActive(dashboardHref('history')) ? 'border-b-2 border-b-blue-600 text-blue-600' : 'text-slate-700'}`}
          >
            <History className="h-5 w-5" />
            <span className="font-body-bold">History</span>
          </Link>
          <Link
            href={dashboardHref('create')}
            className={`flex flex-wrap items-center gap-2 transition-colors hover:text-blue-600 ${isActive(dashboardHref('create')) ? 'border-b-2 border-b-blue-600 text-blue-600' : 'text-slate-700'}`}
          >
            <span className="font-body-bold">Create</span> <ClipboardPlus />
          </Link>
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
            <InputGroup className="w-full max-w-sm">
              <InputGroupAddon align={'inline-start'}>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
              />
            </InputGroup>
          </form>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mx-auto h-full w-full rounded-full focus-visible:border-0 focus-visible:ring-0"
              >
                <Avatar className="mr-4 h-10 w-10 cursor-pointer rounded-full hover:brightness-75">
                  <AvatarImage
                    className={`${isLoggedIn ? '' : 'grayscale'}`}
                    src={avatarSrc}
                  />
                  <AvatarFallback>
                    {isLoggedIn ? (user?.name?.[0] ?? 'U') : 'G'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="left" sideOffset={4}>
              {isLoggedIn ? (
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => router.push(dashboardHref('profile'))}
                  >
                    <span className="font-body-bold">Profile</span>
                    <UserCircleIcon color="#171717" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push('/login');
                          },
                        },
                      });
                    }}
                  >
                    <span className="font-body-bold text-destructive">
                      Logout
                    </span>
                    <DoorOpen color="#e7000b" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Link href="/login">
                      <span className="font-body-bold">Login</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
