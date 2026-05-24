import { WithAuth } from '@/lib/api/auth-protected';
import { APIError, handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { imageFileSchema, UpdateQuizSchema } from '@/lib/schemas/quizschemas';
import { deleteImage, uploadImage } from '@/lib/cloudinary';
import { raw } from '@prisma/client/runtime/client';

const PLACEHOLDER_IMAGE_URL =
  'https://res.cloudinary.com/dbj2tvfzg/image/upload/v1778493470/landscape-placeholder_vrw20c.svg';
const PLACEHOLDER_IMAGE_KEY = 'landscape-placeholder_vrw20c';

/**
 * @description Returns a quiz and its questions and possible answers.
 * @params IDSchema
 * @response 200:QuizDetailResponseSchema
 * @add 404:APIErrorSchema
 * @tag Quiz
 * @openapi
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @description Deletes a quiz.
 * @params IDSchema
 * @response 200:ResponseBase
 * @add 404:APIErrorSchema
 * @add 401:APIErrorSchema
 * @tag Quiz
 * @auth cookieAuth
 * @openapi
 */
export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;
    const quiz = await prisma.quiz.findFirst({
      where: { id },
    });

    if (!quiz) {
      throw new APIError('Invalid Quiz ID', 404);
    } else {
      if (quiz.createdBy === user.id) {
        const questions = await prisma.quizQuestion.findMany({
          where: { quizId: id },
        });
        // delete all images related to the quiz
        for (const q of questions) {
          if (q.imageKey && q.imageKey !== PLACEHOLDER_IMAGE_KEY) {
            await deleteImage(q.imageKey);
          }
        }
        if (quiz.imageKey && quiz.imageKey !== PLACEHOLDER_IMAGE_KEY) {
          await deleteImage(quiz.imageKey);
        }

        await prisma.quiz.delete({
          where: { id },
        });
      } else {
        throw new APIError('User must be owner of the quiz.', 401);
      }
    }

    return NextResponse.json({ sucess: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
});

export const PATCH = WithAuth(async (req, { user, params }) => {
  try {
    const rawData = await req.json();
    const data = UpdateQuizSchema.parse(rawData);

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new APIError('Invalid Quiz ID', 404);
    }

    if (quiz.createdBy !== user.id) {
      throw new APIError('User must be owner of the quiz.', 401);
    }

    await prisma.quiz.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = WithAuth(async (req, { user, params }) => {
  const uploadedKeys: string[] = [];
  try {
    const rawData = await req.formData();
    const data = imageFileSchema.parse(rawData.get('imageFile'));

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new APIError('Invalid Quiz ID', 404);
    }

    if (quiz.createdBy !== user.id) {
      throw new APIError('User must be owner of the quiz.', 401);
    }

    if (!data) {
      throw new APIError('No image file provided', 400);
    }

    const uploaded = await uploadImage(data, 'quiz-app/covers');
    uploadedKeys.push(uploaded.imageKey);

    await prisma.quiz.update({
      where: { id },
      data: {
        imageKey: uploaded.imageKey,
        imageUrl: uploaded.imageUrl,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteImage(key)));
    return handleError(error);
  }
});
