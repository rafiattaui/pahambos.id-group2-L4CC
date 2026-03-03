import { z } from 'zod';

// base schema shared between public and creation
export const QuizQuestionSchema = z.object({
  id: z.uuid(),
  quizId: z.uuid(),
  order: z.number().int().nonnegative(),
  question: z.string().min(5).max(100),
  answers: z.array(z.string().min(1)),
  correctAnswer: z.number().int().nonnegative(),
});

// student view, omits correct answer
export const PublicQuestionSchema = QuizQuestionSchema.omit({
  correctAnswer: true,
});

// database id's are not provided so we omit them
export const CreateQuestionSchema = QuizQuestionSchema.omit({
  id: true,
  quizId: true,
});

export const QuizSchema = z.object;
