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
    // ── 1. Parse FormData ─────────────────────────────────────────────────
    const formData = await req.formData();

    const rawQuiz = {
      title: formData.get('quiz.title'),
      description: formData.get('quiz.description'),
      category: formData.get('quiz.category'),
      imageFile: formData.get('quiz.imageFile') ?? undefined,
    };

    // Reconstruct questions array from flat FormData keys
    // Client sends: questions[0].question, questions[0].order, etc.
    const questionsMap = new Map<number, Record<string, unknown>>();

    for (const [key, value] of formData.entries()) {
      const match = key.match(/^questions\[(\d+)\]\.(.+)$/);
      if (!match) continue;

      const index = Number(match[1]);
      const field = match[2];

      if (!questionsMap.has(index)) questionsMap.set(index, {});
      questionsMap.get(index)![field] = value;
    }

    // answers are sent as questions[0].answers[0], questions[0].answers[1], etc.
    // re-group them into an array
    const rawQuestions = Array.from(questionsMap.entries())
      .sort(([, a], [, b]) => Number(a.order) - Number(b.order)) // sort by intended order
      .map(([, q], normalizedIndex) => {
        // normalizedIndex = 0, 1, 2, ...
        const answers: string[] = [];
        const cleaned: Record<string, unknown> = {};

        for (const [k, v] of Object.entries(q)) {
          const answerMatch = k.match(/^answers\[(\d+)\]$/);
          const correctAnswerMatch = k.match(/^correctAnswers\[(\d+)\]$/);
          if (answerMatch) {
            answers[Number(answerMatch[1])] = v as string;
          } else if (correctAnswerMatch) {
            // Handle correct answers
          } else {
            cleaned[k] = v;
          }
        }

        return {
          ...cleaned,
          order: normalizedIndex, // ← always 0-based, sequential, no gaps
          correctAnswers: Object.entries(q)
            .filter(([k]) => k.match(/^correctAnswers\[(\d+)\]$/))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => Number(v)),
          answers,
          imageFile: cleaned.imageFile ?? undefined,
        };
      });

    console.log(
      JSON.stringify({ quiz: rawQuiz, questions: rawQuestions }, null, 2)
    );

    // ── 2. Zod validation ─────────────────────────────────────────────────
    const data = CreateQuizAndQuestionsSchema.parse({
      quiz: rawQuiz,
      questions: rawQuestions,
    });

    // ── 3. Upload images to Cloudinary ────────────────────────────────────
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

    // ── 4. Persist ────────────────────────────────────────────────────────
    const numQuestions = data.questions.length;

    const result = await prisma.$transaction(async (tx) => {
      const { imageFile, ...quizData } = data.quiz; // exclude imageFile
      const quiz = await tx.quiz.create({
        data: {
          ...quizData,
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
          type: q.type,
          answers: q.answers,
          correctAnswers: q.correctAnswers,
          // quizQuestions do not require images, so we can set them to null if not provided
          imageUrl: questionImages[i]?.imageUrl ?? null,
          imageKey: questionImages[i]?.imageKey ?? null,
        })),
      });

      return { quiz, questions };
    });

    return NextResponse.json(
      { success: true, quizId: result.quiz.id },
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
    const { limit, cursor, sortBy, tags, name } = parseQueryParams(
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
        category: tags?.length ? { in: tags } : undefined,
        title: name
          ? {
              contains: name,
              mode: 'insensitive',
            }
          : undefined,
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
