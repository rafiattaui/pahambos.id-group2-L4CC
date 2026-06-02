import { z } from 'zod';

export const UserSchema = z.object({
  emailVerified: z.boolean(),
  email: z.email(),
  name: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
  id: z.uuid(),
  role: z.enum(['Learner', 'Educator']),
});

// actual user schema to be returned to users
export const UserPublicSchema = UserSchema.omit({
  updatedAt: true,
});

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['Learner', 'Educator']).optional(),
});

export const UserChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long'),
});

// user creation schema provided and validated by betterauth functions.
