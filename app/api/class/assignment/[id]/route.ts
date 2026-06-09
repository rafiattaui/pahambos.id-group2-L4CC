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
    const { id } = await params;

    // check if classroom exists and user is owner
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom) {
      throw new APIError('Classroom not found.', 404);
    }

    // check if user belongs to classroom
    const isMember = await prisma.userClassroom.findFirst({
      where: {
        classroomId: id,
        userId: user.id,
      },
    });
    if (!isMember) {
      throw new APIError('You do not have access to this classroom.', 403);
    }

    const isEducator = classroom.ownerId === user.id;

    // get assigned quizzes for the classroom
    const assignments = await prisma.classroomQuiz.findMany({
      where: { classroomId: id },
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

    // look for userPerformances tied to this classroom's quizzes to get learner completion status
    const quizIds = assignments.map((a) => a.quizId);
    const performances = await prisma.userPerformance.findMany({
      where: {
        quizId: { in: quizIds },
        classroomQuizId: { in: assignments.map((a) => a.id) },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const userClassrooms = await prisma.userClassroom.findMany({
      where: {
        userId: user.id,
        classroomId: id,
      },
    });

    return NextResponse.json({
      success: true,
      data: assignments.map((a) => {
        const completions = performances.filter(
          (p) => p.classroomQuizId === a.id
        );

        return {
          id: a.id,
          quiz: a.Quiz,
          dueDate: a.dueDate,
          isOverdue: new Date() > a.dueDate,
          isAssigner: isEducator,
          ...(isEducator && {
            numLearnersCompleted: completions.length,
            learnersCompleted: completions.map((p) => p.user),
          }),
        };
      }),
    });
  } catch (error) {
    return handleError(error);
  }
});

// assign a quiz to the classroom (educator only)
// expects { quizId: string, dueDate: string } in the request body
// expects classroomId as a URL parameter
// dueDate should be an ISO string that can be parsed into a Date object
export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    // check if classroom exists and user is owner
    const classroom = await prisma.classroom.findUnique({
      where: { id },
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
        classroomId: id,
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

export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    // check if classroom quiz assignment exists
    const classroomQuiz = await prisma.classroomQuiz.findUnique({
      where: { id },
      include: {
        Classroom: true,
      },
    });

    if (!classroomQuiz) {
      throw new APIError('Classroom quiz assignment not found.', 404);
    }

    // check if user is the educator of the classroom
    if (classroomQuiz.Classroom.ownerId !== user.id) {
      throw new APIError('Only the educator can remove quiz assignments.', 403);
    }

    // delete the classroom quiz assignment
    await prisma.classroomQuiz.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz assignment removed from classroom successfully.',
    });
  } catch (error) {
    return handleError(error);
  }
});
