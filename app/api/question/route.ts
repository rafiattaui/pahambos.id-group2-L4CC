import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { APIError } from '@/lib/api/errors';
import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { CreateQuestionSchema } from '@/lib/schemas/quizschemas';

const PLACEHOLDER_IMAGE_URL =
  'https://res.cloudinary.com/dbj2tvfzg/image/upload/v1778493470/landscape-placeholder_vrw20c.svg';
const PLACEHOLDER_IMAGE_KEY = 'landscape-placeholder_vrw20c';

/**
 * @description Add a new question to an already existing quiz.
 * @body CreateQuestionSchema
 * @response 200
 * @add 404:APIErrorSchema
 * @tag QuizQuestion
 * @openapi
 */
export const POST = WithAuth(async (req, { user }) => {
  let uploadedKey: string | null = null;
  try {
    // ── 1. Parse FormData ─────────────────────────────────────────────────
    const formData = await req.formData();

    const rawData = {
      order: Number(formData.get('question.order')), // order is ignored by backend but we still want to validate it if provided
      question: formData.get('question.question'),
      imageFile: formData.get('question.imageFile') ?? undefined,
      answers: formData.getAll('question.answers') as string[],
      correctAnswer: formData
        .getAll('question.correctAnswer')
        .map((v) => Number(v)),
    };

    // ── 2. Zod validation ─────────────────────────────────────────────────
    const data = CreateQuestionSchema.parse(rawData);

    // ── 3. Validate quiz exists ───────────────────────────────────────────
    const quizId = formData.get('quiz.id') as string;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new APIError('Quiz not found', 404);
    }

    // ── 4. Upload image if provided ───────────────────────────────────────
    let imageUrl = PLACEHOLDER_IMAGE_URL;
    let imageKey = PLACEHOLDER_IMAGE_KEY;

    if (data.imageFile) {
      const uploaded = await uploadImage(data.imageFile, 'quiz-app/questions');
      uploadedKey = uploaded.imageKey;
      imageUrl = uploaded.imageUrl;
      imageKey = uploaded.imageKey;
    }

    // ── 5. Persist ────────────────────────────────────────────────────────
    const question = await prisma.$transaction(async (tx) => {
      // Auto-assign order as next available
      const lastQuestion = await tx.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { order: 'desc' },
      });

      const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

      const created = await tx.quizQuestion.create({
        data: {
          order: nextOrder,
          question: data.question,
          answers: data.answers,
          correctAnswer: data.correctAnswer,
          imageUrl,
          imageKey,
          quizId,
        },
      });

      await tx.quiz.update({
        where: { id: quizId },
        data: { numQuestions: { increment: 1 } },
      });

      return created;
    });

    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    if (uploadedKey) await deleteImage(uploadedKey).catch(() => {});
    return handleError(error);
  }
});
