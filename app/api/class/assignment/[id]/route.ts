import { NextRequest, NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError, APIError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addQuizToClassroomSchema = z.object({
  quizId: z.string(),
  dueDate: z.coerce.date(),
});

export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const { classroomId } = await params;

    // check if classroom exists and user is owner
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      throw new APIError('Classroom not found.', 404);
    }

    // check if user belongs to classroom
    const isMember = await prisma.userClassroom.findFirst({
      where: {
        classroomId,
        userId: user.id,
      },
    });
    if (!isMember) {
      throw new APIError('You do not have access to this classroom.', 403);
    }

    // get assigned quizzes for the classroom
    const assignments = await prisma.classroomQuiz.findMany({
      where: { classroomId },
      include: {
        Quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (assignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No quizzes assigned to this classroom yet.',
      });
    }

    return NextResponse.json({
      success: true,
      data: assignments.map((a) => ({
        id: a.id,
        quiz: a.Quiz,
        dueDate: a.dueDate,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const { classroomId } = await params;

    // check if classroom exists and user is owner
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      throw new APIError('Classroom not found.', 404);
    }
    if (classroom.ownerId !== user.id) {
      throw new APIError('Only the educator can assign quizzes.', 403);
    }

    const rawData = await req.json();

    // Validate the request body
    const { quizId, dueDate } = addQuizToClassroomSchema.parse(rawData);

    // check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new APIError('Quiz not found.', 404);
    }

    // create the classroom quiz assignment
    const classroomQuiz = await prisma.classroomQuiz.create({
      data: {
        classroomId,
        quizId,
        dueDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz assigned to classroom successfully.',
      data: classroomQuiz,
    });
  } catch (error) {
    return handleError(error);
  }
});
