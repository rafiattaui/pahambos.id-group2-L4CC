import { WithAuth } from '@/lib/api/auth-protected';
import { handleError, APIError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { deleteImage } from '@/lib/cloudinary';

const PLACEHOLDER_IMAGE_KEY = 'landscape-placeholder_vrw20c';

export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      include: { quiz: true },
    });

    if (!question) {
      throw new APIError('Question not found', 404);
    }

    if (question.quiz.createdBy !== user.id) {
      throw new APIError('Unauthorized to update this question', 403);
    }

    if (question.imageKey && question.imageKey !== PLACEHOLDER_IMAGE_KEY) {
      await deleteImage(question.imageKey);
    }

    await prisma.quizQuestion.update({
      where: { id },
      data: {
        imageUrl: null,
        imageKey: null,
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
});
