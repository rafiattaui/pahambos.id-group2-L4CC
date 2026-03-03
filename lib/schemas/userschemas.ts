import { z } from 'zod';

export const UserSchema = z.object({
  emailVerified: z.boolean(),
  image: z.url().nullable(),
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
  role: true
});

// user creation and update schemas are already provided by betterauth
