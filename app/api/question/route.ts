import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { APIError } from '@/lib/api/errors';
import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { CreateOrUpdateQuestionListSchema } from '@/lib/schemas/quizschemas';

/**
 * @description Add a new question an already existing quiz.
 * @body CreateQuestionListSchema
 * @response 200
 * @add 404:APIErrorSchema
 * @tag QuizQuestion
 * @openapi
 */
export const POST = WithAuth(async (req, { user }) => {
  try {
    const rawData = await req.json();
    const data = CreateOrUpdateQuestionListSchema.parse(rawData);

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
    });

    if (!quiz) {
      throw new APIError('Failed to retrieve valid quiz of that ID', 404);
    }

    // Perform updates and creates in a single transaction
    await prisma.$transaction(async (tx) => {
      let newQuestionsCount = 0;

      for (const question of data.questions) {
        // If the question has an ID, we try to update; otherwise, we create.
        // This assumes your schema allows 'id' to be optional in the request.
        if (question.id) {
          await tx.quizQuestion.update({
            where: { id: question.id },
            data: { ...question, quizId: data.quizId },
          });
        } else {
          await tx.quizQuestion.create({
            data: { ...question, quizId: data.quizId },
          });
          newQuestionsCount++;
        }
      }

      // Increment the count only for truly NEW questions
      if (newQuestionsCount > 0) {
        await tx.quiz.update({
          where: { id: data.quizId },
          data: {
            numQuestions: {
              increment: newQuestionsCount,
            },
          },
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
});
