import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import {
  imageFileSchema,
  PublicQuestionSchema,
  UpdateQuestionSchema,
} from '@/lib/schemas/quizschemas';
import { NextRequest, NextResponse } from 'next/server';
import { APIError } from '@/lib/api/errors';
import { deleteImage, uploadImage } from '@/lib/cloudinary';

const PLACEHOLDER_IMAGE_URL =
  'https://res.cloudinary.com/dbj2tvfzg/image/upload/v1778493470/landscape-placeholder_vrw20c.svg';
const PLACEHOLDER_IMAGE_KEY = 'landscape-placeholder_vrw20c';

/**
 * @description Retrieve a question and its possible answers.
 * @params IDSchema
 * @response 200:PublicQuestionSchema
 * @add 404:APIErrorSchema
 * @tag QuizQuestion
 * @openapi
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.quizQuestion.findFirst({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        ...question,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
}

export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // Find the question first to get its current order and quizId
      const questionToDelete = await tx.quizQuestion.findUnique({
        where: { id },
      });

      if (!questionToDelete) {
        throw new APIError('Question not found', 404);
      }

      const { quizId, order: deletedOrder } = questionToDelete;

      // Delete the target question
      await tx.quizQuestion.delete({
        where: { id },
      });

      // Re-order: Shift all questions that came AFTER this one down by 1
      await tx.quizQuestion.updateMany({
        where: {
          quizId: quizId,
          order: { gt: deletedOrder },
        },
        data: {
          order: { decrement: 1 },
        },
      });

      // Update the parent Quiz count
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          numQuestions: { decrement: 1 },
        },
      });

      return { success: true };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
});

export const PATCH = WithAuth(async (req, { user, params }) => {
  try {
    const rawData = await req.json();
    const data = UpdateQuestionSchema.parse(rawData);
    const { id } = await params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!question) {
      throw new APIError('Question not found', 404);
    }

    if (user.id !== question.quiz.createdBy) {
      throw new APIError('Unauthorized to update this question', 403);
    }

    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id },
      data: {
        question: data.question,
        type: data.type,
        time: data.time,
        answers: data.answers,
        correctAnswers: data.correctAnswers,
      },
    });

    const res = PublicQuestionSchema.parse(updatedQuestion);
    return NextResponse.json(
      {
        success: true,
        ...res,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = WithAuth(async (req, { user, params }) => {
  try {
    const rawData = await req.formData();
    const imageFile = imageFileSchema.parse(rawData.get('imageFile'));

    if (!imageFile) {
      throw new APIError('No image file provided', 400);
    }

    const quizQuestion = await prisma.quizQuestion.findUnique({
      where: { id: (await params).id },
      include: {
        quiz: true,
      },
    });

    if (!quizQuestion) {
      throw new APIError('Question not found', 404);
    }

    if (user.id !== quizQuestion.quiz.createdBy) {
      throw new APIError('Unauthorized to update this question', 403);
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadImage(imageFile, 'quiz-questions');

    // Delete old image from Cloudinary if it exists and is not the placeholder
    if (
      quizQuestion.imageKey &&
      quizQuestion.imageKey !== PLACEHOLDER_IMAGE_KEY
    ) {
      await deleteImage(quizQuestion.imageKey);
    }

    await prisma.quizQuestion.update({
      where: { id: quizQuestion.id },
      data: {
        imageUrl: uploadResult.imageUrl,
        imageKey: uploadResult.imageKey,
      },
    });

    return NextResponse.json(
      {
        success: true,
        imageUrl: uploadResult.imageUrl,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
});
