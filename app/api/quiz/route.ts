import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { CreateQuizAndQuestionsSchema } from '@/lib/schemas/quizschemas';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { request } from 'http';
import { parseQueryParams, QuizListQuerySchema } from '@/lib/schemas/queryparams';

export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const rawData = await req.json();
    const data = CreateQuizAndQuestionsSchema.parse(rawData);

    const numQuestions = data.questions.length;

    // use transaction to prevent zombie transaction where one transaction succeeds and the other fails.
    const result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          ...data.quiz,
          numQuestions,
          creator: { connect: { id: user.id } }
        }
      });

      const questions = await tx.quizQuestion.createMany({
        data: data.questions.map((element) => ({
          ...element,
          quizId: quiz.id
        }))
      });

      return { quiz, questions };
    });

    return NextResponse.json({success: true, quizId: result.quiz.id}, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
});

export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const searchParams = parseQueryParams(req.nextUrl.searchParams, QuizListQuerySchema)

    
  } catch (error) {
    return handleError(error)
  }
})
