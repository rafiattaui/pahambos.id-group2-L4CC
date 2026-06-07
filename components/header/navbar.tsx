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
      <a href="/dashboard" className="flex items-center gap-2">
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
                  <span className="font-body font-bold">Profile</span>
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
                  <span className="font-body text-destructive font-bold">
                    Logout
                  </span>
                  <DoorOpen color="#e7000b" />
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
