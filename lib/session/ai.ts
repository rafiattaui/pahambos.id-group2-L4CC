import { r_SessionSchema } from '@/lib/schemas/sessionschemas';
import { z } from 'zod';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export async function generateFeedback(
  session: z.infer<typeof r_SessionSchema>,
  sessionId: string
) {
  // ai feedback logic
  // fetch question and answer data for the session, then generate feedback using the ai model.

  const quizData = await prisma.quiz.findUnique({
    where: { id: session.quizId },
    include: {
      questions: {
        select: {
          question: true,
          type: true,
          answers: true,
          correctAnswers: true,
        },
      },
    },
  });

  if (!quizData) {
    throw new Error('Quiz data not found for feedback generation.');
  }

  // fetch user's answers from redis.
  const userAnswers = await redis.hgetall(`session:${sessionId}:answers`);
}
