import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QuizInterface from '@/components/question-types/QuizInterface';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuizPage({ params }: Props) {
  const { id } = await params;
  console.log('Quiz ID:', id);
  const questions = await prisma.quizQuestion.findMany({
    where: { quizId: id },
    orderBy: { order: 'asc' },
  });

  console.log('Fetched Questions:', questions); // Debug log to check fetched questions

  if (!questions.length) return notFound();

  return <QuizInterface questions={questions} />;
}
