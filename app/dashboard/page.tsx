import DashboardMain from '@/components/dashboardComp/dashboardMain';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import DashCarousel from '@/components/dashboardComp/dashcarousel';

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <div>
      <main>
        <DashboardMain
          userName={session?.user?.name ?? 'User'}
          userAvatar={session?.user?.image ?? undefined}
        />
      </main>
      <DashCarousel />
    </div>
  );
}
