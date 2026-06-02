import { z } from 'zod';

export const ClassroomSchema = z.object({
  id: z.uuid(),
  name: z.string().min(3),
  ownerId: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateClassroomSchema = z.object({
  name: z.string().min(3),
});

export const UpdateClassroomSchema = z.object({
  name: z.string().min(3).optional(),
});
