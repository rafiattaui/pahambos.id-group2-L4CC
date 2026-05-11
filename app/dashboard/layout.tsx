import { auth } from '@/lib/auth';
import DashNavbar, {
  MobileBottomNav,
} from '@/components/dashboardComp/dashnavbar';
import { headers } from 'next/dist/server/request/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
        <div>
          <DashNavbar user={session?.user ?? null} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 md:pb-6">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}

/*
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <DashNavbar />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
  */
