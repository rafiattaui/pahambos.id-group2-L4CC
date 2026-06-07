'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authClient } from '@/lib/auth-client';
import Logo from './logo';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserCircleIcon, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardHref } from '../dashboardComp/dashboardHref';
import { Separator } from '@/components/ui/separator';

function MobileBurgerMenu(props: {
  sections: string[];
  onSectionClick: (section: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  return (
    <div className="md:hidden">
      {/* Burger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        className="relative z-50"
      >
        {/* Animated hamburger → X */}
        <div className="mx-auto flex h-6 w-6 flex-col items-center justify-center gap-1.5">
          <span
            className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-300 ${
              isOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all duration-300 ${
              isOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </div>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-down drawer */}
      <div
        className={`fixed top-0 right-0 left-0 z-40 rounded-b-3xl bg-white shadow-xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        {/* Drawer header */}
        <div className="ml-3 flex items-center justify-between border-b px-6 pt-3 pb-3">
          <span className="font-heading text-xl font-black">
            <span className="text-blue-600">Paham</span>
            <span className="text-orange-500">Bos</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-1 px-4 py-4">
          {props.sections.map((section, index) => (
            <button
              key={index}
              onClick={() => {
                props.onSectionClick(section.toLowerCase());
                setIsOpen(false);
              }}
              className="font-body flex items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              {section}
            </button>
          ))}
        </div>
        {!isAuthenticated && (
          <div className="flex gap-3 border-t px-6 py-4">
            <Link
              href="/register"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              <Button className="w-full bg-blue-600 font-bold text-white hover:bg-blue-700">
                Register
              </Button>
            </Link>
            <Link
              href="/login"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              <Button
                variant="outline"
                className="w-full font-bold text-slate-700"
              >
                Log In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar(props: { sections: string[] }) {
  const [isClicked, setIsClicked] = useState(false);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const isAuthenticated = !!session;
  const isLoggedIn = !!session?.user;
  const avatarSrc = session?.user?.image || '/not_logged_in_avatar.jpg';

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
    <nav className="relative flex w-full flex-row items-center border-b">
      <MobileBurgerMenu
        sections={props.sections}
        onSectionClick={scrollToSection}
      />
      <a href="/dashboard" className="hidden items-center gap-2 md:flex">
        <Logo></Logo>
      </a>
      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center text-slate-800 md:flex">
        {props.sections.map((section, index) => (
          <div
            key={index}
            className="flex h-14.5 w-32 items-center justify-center hover:bg-gray-200"
          >
            <Button
              variant="ghost"
              className="font-body font-bold hover:bg-transparent"
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
            <Button
              onClick={() => router.push('/register')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Register
            </Button>
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Log In
            </Button>
          </>
        ) : (
          <></>
        )}

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
                  {isLoggedIn ? (session?.user?.name?.[0] ?? 'U') : 'G'}
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
                  <span className="font-body font-bold text-blue-600">
                    Profile
                  </span>
                  <UserCircleIcon color="#2563eb" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-orange-500"
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
                  <span className="font-body font-bold text-orange-500">
                    Logout
                  </span>
                  <DoorOpen color="#f97316" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link href="/login">
                    <span className="font-body font-bold">Login</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
