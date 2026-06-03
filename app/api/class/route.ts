import { NextRequest, NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError, APIError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

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

export const GET = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
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

export const POST = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();

      if (body?.action === 'create') {
        const { name } = body.name?.trim();
        if (!name) throw new APIError('Class name is required', 400);
        if (name.length > 100)
          throw new APIError('Class name must be 100 characters or less', 400);

        const classroom = await prisma.classroom.create({
          data: {
            name,
            ownerId: user.id,
            members: { create: { userId: user.id } },
          },
          include,
        });
        return NextResponse.json(shape(classroom), { status: 201 });
      }

      if (body?.action === 'join') {
        const classroomId = body.classroomId?.trim();
        if (!classroomId) throw new APIError('classroomId is required.', 400);

        const classroom = await prisma.classroom.findUnique({
          where: { id: classroomId },
        });
        if (!classroom) throw new APIError('Classroom not found.', 404);
        if (classroom.ownerId === user.id)
          throw new APIError('You are the educator of this class.', 403);

        await prisma.userClassroom.upsert({
          where: { userId_classroomId: { userId: user.id, classroomId } },
          create: { userId: user.id, classroomId },
          update: {},
        });

        const updated = await prisma.classroom.findUniqueOrThrow({
          where: { id: classroomId },
          include,
        });
        return NextResponse.json({ classroom: shape(updated) });
      }

      throw new APIError(`Unknown action "${body?.action}".`, 400);
    } catch (error) {
      return handleError(error);
    }
  }
);

export const PATCH = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();
      const classroomId = body?.classroomId?.trim();
      const name = body?.name?.trim();

      if (!classroomId) throw new APIError('classroomId is required.', 400);
      if (!name) throw new APIError('name is required.', 400);
      if (name.length > 100)
        throw new APIError('Class name must be 100 characters or fewer.', 400);

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

export const DELETE = WithAuth(
  async (req: NextRequest, { user }: { user: { id: string } }) => {
    try {
      const body = await req.json();
      const classroomId = body?.classroomId?.trim();

      if (!classroomId) throw new APIError('classroomId is required.', 400);

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });
      if (!classroom) throw new APIError('Classroom not found.', 404);
      if (classroom.ownerId !== user.id)
        throw new APIError('Only the educator can do this.', 403);

      if (body?.memberId) {
        const memberId = body.memberId.trim();
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
