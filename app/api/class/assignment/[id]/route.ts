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

    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom) {
      throw new APIError('Classroom not found.', 404);
    }

    // Verify the requesting user is a member of this classroom before returning any data
    const membership = await prisma.userClassroom.findFirst({
      where: { classroomId: id, userId: user.id },
    });

    if (!membership) {
      throw new APIError('You do not have access to this classroom.', 403);
    }
    // Educators (classroom owners) receive a richer response including per-learner completion data
    const isEducator = classroom.ownerId === user.id;

    // Fetch assignments and the learner roster in parallel; skip the roster for learners
    // since they only need their own completion status
    const [assignments, allLearners] = await Promise.all([
      prisma.classroomQuiz.findMany({
        where: { classroomId: id },
        include: {
          Quiz: {
            select: { id: true, title: true, description: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      // Only fetch learner roster when the requester is an educator
      isEducator
        ? prisma.userClassroom.findMany({
            where: { classroomId: id, role: 'Learner' },
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    if (assignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No quizzes assigned to this classroom yet.',
      });
    }

    // Fetch all performance records for every assignment in this classroom in one query,
    // rather than querying per-assignment inside the map below
    const performances = await prisma.userPerformance.findMany({
      where: {
        classroomQuizId: { in: assignments.map((a) => a.id) },
      },
      select: {
        classroomQuizId: true,
        userId: true,
        finalScore: true,
        accuracyRate: true,
        completedAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Index performances by classroomQuizId so each assignment lookup below is O(1)
    // instead of scanning the full performances array on every iteration
    type Performance = (typeof performances)[number];
    const performancesByAssignment = performances.reduce<
      Record<string, Performance[]>
    >((acc, p) => {
      if (!p.classroomQuizId) return acc;
      (acc[p.classroomQuizId] ??= []).push(p);
      return acc;
    }, {});

    const learnerSet = new Set(allLearners.map((uc) => uc.user.id));

    return NextResponse.json({
      success: true,
      data: assignments.map((a) => {
        // Pull the pre-bucketed completions for this specific assignment
        const completions = performancesByAssignment[a.id] ?? [];
        // Build a set of user IDs who have completed this assignment for fast membership checks
        const completedIds = new Set(completions.map((p) => p.userId));

        return {
          id: a.id,
          quiz: a.Quiz,
          dueDate: a.dueDate,
          isOverdue: new Date() > a.dueDate,
          isAssigner: isEducator,
          // Check whether the requesting user specifically has a performance record for this assignment
          userHasCompleted: completedIds.has(user.id),
          // Spread educator-only fields conditionally; learners receive none of this
          ...(isEducator && {
            numLearnersCompleted: completions.length,
            numLearnersTotal: allLearners.length,
            // Return score details for learners who have submitted
            learnersCompleted: completions.map((p) => ({
              id: p.user.id,
              name: p.user.name,
              email: p.user.email,
              image: p.user.image,
              finalScore: p.finalScore,
              accuracyRate: p.accuracyRate,
              completedAt: p.completedAt,
            })),
            // Diff the full learner roster against completedIds to find who hasn't submitted yet
            learnersNotCompleted: allLearners
              .filter((uc) => !completedIds.has(uc.user.id))
              .map((uc) => ({
                id: uc.user.id,
                name: uc.user.name,
                email: uc.user.email,
                image: uc.user.image,
              })),
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
