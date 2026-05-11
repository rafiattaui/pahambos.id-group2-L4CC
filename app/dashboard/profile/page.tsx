import ProfileCard from '@/components/profileCard';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Profile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/login');

  return (
    <div className="flex h-screen items-center justify-center">
      <ProfileCard user={session.user} />
    </div>
  );
}
