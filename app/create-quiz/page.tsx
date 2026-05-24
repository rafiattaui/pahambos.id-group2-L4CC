import CreateQuizForm from '@/components/createpages/createquiz';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CreateQuiz() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect('/login?next=/create-quiz');
  }
  return <CreateQuizForm />;
}
