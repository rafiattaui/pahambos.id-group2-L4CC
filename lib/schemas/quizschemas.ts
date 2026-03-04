import { z } from 'zod';

// base schema shared between public and creation
export const QuizQuestionSchema = z.object({
  id: z.uuid(),
  quizId: z.uuid(),
  order: z.int().nonnegative(),
  question: z.string().min(5).max(100),
  answers: z.array(z.string().min(2)).min(2),
  correctAnswer: z.int().nonnegative(),
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

const CategoryEnum = z.enum([
  'Mathematics',
  'Science',
  'History',
  'Language',
  'Geography',
  'Technology',
  'General',
]);

export const QuizSchema = z.object({
  id: z.uuid(),
  createdBy: z.uuid(),
  createdAt: z.coerce.date(),
  title: z.string().min(5),
  description: z.string(),
  category: CategoryEnum,
  numQuestions: z.int().nonnegative(),
});

export const PublicQuizSchema = QuizSchema;

export const CreateQuizSchema = QuizSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  numQuestions: true,
  // these are fields that will not be sent by the user, they will be added validated by the backend.
});

// actual quiz creation schema.
export const CreateQuizAndQuestionsSchema = z.object({
  quiz: CreateQuizSchema,
  questions: z.array(CreateQuestionSchema).min(4),
});
