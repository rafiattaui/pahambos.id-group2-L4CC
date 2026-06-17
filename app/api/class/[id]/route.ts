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

// Join Classroom via ID

const ClassroomJoinSchema = z.object({
  id: z.string(),
});

export const POST = WithAuth(
  async (
    _req: NextRequest,
    {
      user,
      params,
    }: { user: { id: string }; params: Promise<Record<string, string>> }
  ) => {
    try {
      const classroomId = z.string().parse((await params).id);

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });
      if (!classroom) throw new APIError('Classroom not found.', 404);
      if (classroom.ownerId === user.id)
        throw new APIError('You are the educator of this class.', 403);

      const existing = await prisma.userClassroom.findUnique({
        where: { userId_classroomId: { userId: user.id, classroomId } },
      });
      if (existing) throw new APIError('You are already in this class.', 409);

      await prisma.userClassroom.upsert({
        where: { userId_classroomId: { userId: user.id, classroomId } },
        create: { userId: user.id, classroomId, role: 'Learner' },
        update: {},
      });

      const updated = await prisma.classroom.findUniqueOrThrow({
        where: { id: classroomId },
        include,
      });
      return NextResponse.json({ classroom: shape(updated) });
    } catch (error) {
      return handleError(error);
    }
  }
);
