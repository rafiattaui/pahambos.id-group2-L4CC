import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QuizInterface from '@/components/question-types/QuizInterface';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignmentId?: string }>;
};

export default async function QuizPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { assignmentId } = await searchParams;

  // Validate the quiz exists — session creation and question fetching
  // are handled client-side by QuizInterface via the session API.
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!quiz) return notFound();

  return <QuizInterface quizId={id} classroomQuizId={assignmentId} />;
}
