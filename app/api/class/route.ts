import { NextRequest, NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError, APIError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const include = {
  owner: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} as const;

const shape = (cls: any) => ({
  id: cls.id,
  name: cls.name,
  owner: cls.owner,
  members: cls.members
    .filter((m: any) => m.userId !== cls.ownerId)
    .map((m: any) => m.user),
});

// Get Classrooms for Educator and Learner

export const GET = WithAuth(
  async (_req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const [owned, joined] = await Promise.all([
        prisma.classroom.findMany({
          where: { ownerId: user.id },
          include,
          orderBy: { name: 'asc' },
        }),
        prisma.classroom.findMany({
          where: {
            ownerId: { not: user.id },
            members: { some: { userId: user.id } },
          },
          include,
          orderBy: { name: 'asc' },
        }),
      ]);

      return NextResponse.json({
        educatorClasses: owned.map(shape),
        learnerClasses: joined.map(shape),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Create Classrooms

const ClassroomCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const POST = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();
      const { name } = ClassroomCreateSchema.parse(body);

      const classroom = await prisma.classroom.create({
        data: {
          name,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'Learner' } },
        },
        include,
      });

      return NextResponse.json(shape(classroom), { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Update Classroom Name

const ClassroomUpdateSchema = z.object({
  classroomId: z.string(),
  name: z.string().min(1).max(100),
});

export const PATCH = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();
      const { classroomId, name } = ClassroomUpdateSchema.parse(body);

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });
      if (!classroom) throw new APIError('Classroom not found.', 404);
      if (classroom.ownerId !== user.id)
        throw new APIError('Only the educator can do this.', 403);

      const updated = await prisma.classroom.update({
        where: { id: classroomId },
        data: { name },
        include,
      });
      return NextResponse.json({ classroom: shape(updated) });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Delete Classroom or Remove Member

const ClassroomDeleteSchema = z.object({
  classroomId: z.string(),
  memberId: z.string().optional(),
});

export const DELETE = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();
      const { classroomId, memberId } = ClassroomDeleteSchema.parse(body);

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });
      if (!classroom) throw new APIError('Classroom not found.', 404);
      if (classroom.ownerId !== user.id)
        throw new APIError('Only the educator can do this.', 403);

      if (memberId) {
        if (memberId === user.id)
          throw new APIError(
            'You cannot remove yourself as the educator.',
            400
          );
        await prisma.userClassroom.deleteMany({
          where: { userId: memberId, classroomId },
        });
        return NextResponse.json({ removed: memberId });
      }

      await prisma.classroom.delete({ where: { id: classroomId } });
      return NextResponse.json({ deleted: classroomId });
    } catch (error) {
      return handleError(error);
    }
  }
);
