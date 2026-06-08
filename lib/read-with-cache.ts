import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { PublicQuestionSchema } from './schemas/quizschemas';
import { z } from 'zod';

export async function GetQuestionWithCache(
  quizId: string,
  questionIndex: number
): Promise<z.infer<typeof PublicQuestionSchema> | null> {
  const cacheKey = `quiz:${quizId}:question:${questionIndex}`;
  const cachedQuestion = await redis.get(cacheKey);

  if (cachedQuestion) {
    return JSON.parse(cachedQuestion);
  }

  const question = await prisma.quizQuestion.findFirst({
    where: {
      quizId,
      order: questionIndex,
    },
  });

  if (question) {
    await redis.set(cacheKey, JSON.stringify(question), 'EX', 60 * 60); // Cache for 1 hour
  }

  const parsed = PublicQuestionSchema.safeParse(question);

  if (!parsed.success) {
    console.error('Failed to parse question:', parsed.error);
    return null;
  }

  return parsed.data;
}

export async function invalidateQuestionCache(
  quizId: string,
  questionIndex: number
) {
  const cacheKey = `quiz:${quizId}:question:${questionIndex}`;
  await redis.del(cacheKey);
}
