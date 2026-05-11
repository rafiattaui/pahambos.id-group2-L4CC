import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { CreateQuizAndQuestionsSchema } from '@/lib/schemas/quizschemas';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseQueryParams,
  QuizListQuerySchema,
} from '@/lib/schemas/queryparams';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

const PLACEHOLDER_IMAGE_URL =
  'https://res.cloudinary.com/dbj2tvfzg/image/upload/v1778493470/landscape-placeholder_vrw20c.svg';
const PLACEHOLDER_IMAGE_KEY = 'landscape-placeholder_vrw20c';

/**
 * @description Creates a new quiz
 * @body CreateQuizAndQuestionsSchema
 * @response 200:QuizCreationSuccessResponseSchema
 * @auth cookieAuth
 * @tag Quiz
 * @contentType application/json
 * @openapi
 */
export const POST = WithAuth(async (req, { user }) => {
  const uploadedKeys: string[] = [];
  try {
    const rawData = await req.json();
    const data = CreateQuizAndQuestionsSchema.parse(rawData);

    // upload images to cloudinary.

    async function safeUpload(file: File, folder: string) {
      const result = await uploadImage(file, folder);
      uploadedKeys.push(result.imageKey);
      return result;
    }

    let quizImage: { imageUrl: string; imageKey: string } | null = null;
    if (data.quiz.imageFile) {
      quizImage = await safeUpload(data.quiz.imageFile, 'quiz-app/covers');
    }

    const questionImages = await Promise.all(
      data.questions.map((q) =>
        q.imageFile
          ? safeUpload(q.imageFile, 'quiz-app/questions')
          : Promise.resolve(null)
      )
    );
    // upload quiz and questions
    const numQuestions = data.questions.length;

    let result: { quiz: any; questions: any } | null = null;
    result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          ...data.quiz,
          imageFile: undefined,
          imageUrl: quizImage?.imageUrl ?? PLACEHOLDER_IMAGE_URL,
          imageKey: quizImage?.imageKey ?? PLACEHOLDER_IMAGE_KEY,
          numQuestions,
          creator: { connect: { id: user.id } },
        },
      });

      const questions = await tx.quizQuestion.createMany({
        data: data.questions.map((q, i) => ({
          quizId: quiz.id,
          order: q.order,
          question: q.question,
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          imageUrl: questionImages[i]?.imageUrl ?? PLACEHOLDER_IMAGE_URL,
          imageKey: questionImages[i]?.imageKey ?? PLACEHOLDER_IMAGE_KEY,
        })),
      });

      return { quiz, questions };
    });

    return NextResponse.json(
      { success: true, quizId: result!.quiz.id },
      { status: 200 }
    );
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteImage(key)));
    return handleError(error);
  }
});

/**
 * @description Returns a list of quizzes
 * @params QuizListQuerySchema
 * @response 200:QuizListResponseSchema
 * @contentType application/json
 * @tag Quiz
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { limit, cursor, sortBy, tags } = parseQueryParams(
      req.nextUrl.searchParams,
      QuizListQuerySchema
    );

    const quizList = await prisma.quiz.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        id: sortBy,
      },
      where: {
        category: { in: tags },
      },
    });

    let nextCursor: typeof cursor | null = null;

    if (quizList.length > limit) {
      const nextQuiz = quizList.pop();
      nextCursor = nextQuiz!.id;
    }

    return NextResponse.json({ data: quizList, nextCursor }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
