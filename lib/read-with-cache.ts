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

  return PublicQuestionSchema.parse(question);
}

export async function invalidateQuestionCache(quizId: string) {
  // because orders could be out of sync,
  // we should just invalidate all questions for the quiz to be safe
  const keys = await redis.keys(`quiz:${quizId}:question:*`);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}
