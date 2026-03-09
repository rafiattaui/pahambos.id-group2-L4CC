import { z } from 'zod';

export const UserSchema = z.object({
  emailVerified: z.boolean(),
  image: z.string().optional(), // fix
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

export const UserPartialSchema = UserSchema.partial({
  image: true,
  name: true,
  role: true,
});

// user creation schema provided and validated by betterauth functions.
