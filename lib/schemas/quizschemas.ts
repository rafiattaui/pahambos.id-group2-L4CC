import { z } from 'zod';

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Max image size is 5MB.')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpeg, .jpg, png, webp are supported.'
  );

// base schema shared between public and creation
export const QuizQuestionSchema = z.object({
  id: z.uuid(),
  quizId: z.uuid(),
  order: z.int().nonnegative(),
  question: z.string().min(5).max(100),
  type: z.enum(['MultiSelect', 'SingleSelect']),
  imageUrl: z.url().optional(),
  imageKey: z.string().optional(),
  answers: z.array(z.string()).min(2).max(4),
  correctAnswers: z.array(z.int().nonnegative()).min(1).max(4), // allow multiple correct answers for flexibility
});

// public view
export const PublicQuestionSchema = QuizQuestionSchema;

// database id's are not provided so we omit them
export const CreateQuestionSchema = z.object({
  order: z.int().nonnegative(),
  question: z.string().min(5).max(100),
  type: z.enum(['MultiSelect', 'SingleSelect']),
  imageFile: imageFileSchema.optional(),
  answers: z.array(z.string()).min(2).max(4),
  correctAnswers: z.array(z.int().nonnegative()).min(1).max(4),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial().omit({
  order: true, // order should not be updated directly, it is managed by the backend.
});

export const CreateOrUpdateQuestionListSchema = z.object({
  questions: z.array(
    QuizQuestionSchema.omit({
      quizId: true,
    })
  ),
  quizId: z.uuid(),
});

export const CategoryEnum = z.enum([
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
  imageUrl: z.url().optional(),
  imageKey: z.string().optional(),
  category: CategoryEnum,
  numQuestions: z.int().nonnegative(),
});

export const PublicQuizSchema = QuizSchema;

export const CreateQuizSchema = z.object({
  title: z.string().min(5),
  description: z.string(),
  imageFile: imageFileSchema.optional(),
  category: CategoryEnum,
});

export const UpdateQuizSchema = CreateQuizSchema.partial();

// actual quiz creation schema.
export const CreateQuizAndQuestionsSchema = z.object({
  quiz: CreateQuizSchema,
  questions: z.array(CreateQuestionSchema).min(2),
});

// schemas below are meant to be used in api docs
export const ResponseBase = z.object({
  success: z.boolean(),
});

export const APIErrorSchema = z.object({
  message: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
  meta: z.string().optional(),
});

export const IDSchema = z.object({
  id: z.uuid(),
});

export const QuizDetailResponseSchema = z.object({
  quiz: PublicQuizSchema.extend({
    questions: z.array(PublicQuestionSchema),
  }),
});

export const QuizListResponseSchema = z.object({
  data: z.array(PublicQuizSchema),
  nextCursor: z.string().nullable().optional(),
});

export const QuizCreationSuccessResponseSchema = ResponseBase.extend({
  quizId: z.uuid(),
});
