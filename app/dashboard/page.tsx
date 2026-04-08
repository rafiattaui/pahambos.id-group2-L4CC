import DashboardMain from '@/components/dashboardComp/dashboardMain';
import DashCarousel from '@/components/dashboardComp/dashcarousel';

export default function Dashboard() {
  return (
    <div>
      <main>
        <DashboardMain />
      </main>
      <DashCarousel />
    </div>
  );
}
