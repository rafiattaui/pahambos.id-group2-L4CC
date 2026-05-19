import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QuizInterface from '@/components/question-types/QuizInterface';

export default async function QuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  const questions = await prisma.quizQuestion.findMany({
    where: { quizId: params.quizId },
    orderBy: { order: 'asc' },
  });

  if (!questions.length) return notFound();

  return <QuizInterface questions={questions} />;
}
