// app/create-quiz/[id]/edit/page.tsx
// Server Component — runs on the server, so the initial quiz data is always
// fresh on every page load/refresh. No client state needed for seeding.

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import CreateQuizForm, {
  type InitialQuizData,
} from '@/components/createpages/createquiz';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuizPage({ params }: PageProps) {
  const { id } = await params;

  // ── 1. Auth check ────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    // If not authenticated, redirect to homepage (could also show a 403 page instead)
    redirect(`/login?next=/create-quiz/${id}/edit`);
  }
  // ── 2. Fetch quiz + questions ────────────────────────────────────────────
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: 'asc' } } },
  });

  // Quiz doesn't exist
  if (!quiz) notFound();

  // ── 3. Ownership check ───────────────────────────────────────────────────
  // If the user is not the creator they should not be able to see the edit page
  if (quiz.createdBy !== session.user.id) notFound();

  // ── 4. Map DB shape → InitialQuizData ────────────────────────────────────
  const initialData: InitialQuizData = {
    quizId: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    imageUrl: quiz.imageUrl ?? null,
    questions: quiz.questions.map((q) => ({
      dbId: q.id,
      order: q.order,
      // Prisma stores these as string enums matching the schema
      type: q.type as 'SingleSelect' | 'MultiSelect',
      question: q.question,
      answers: q.answers as string[],
      correctAnswers: q.correctAnswers as number[],
      imageUrl: q.imageUrl ?? null,
    })),
  };

  return <CreateQuizForm initialData={initialData} />;
}
