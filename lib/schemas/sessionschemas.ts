import { z } from 'zod';
import { QuizQuestionSchema } from './quizschemas';

// session schemas for redis storage.

// player_session:{user_id}
export const r_PlayerSessionSchema = z.object({
  sessionId: z.string(),
});

// session:{session_id}
export const r_SessionSchema = z.object({
  quizId: z.string(),
  userId: z.string(),
  classroomQuizId: z.string().optional(),
  status: z.enum(['waiting', 'active', 'finished']),
  score: z.number().default(0),
  currentQuestionIndex: z.number().default(0),
  questionStartTime: z.coerce.date(),
  totalQuestions: z.number().default(0),
  hintsUsed: z.number().default(0),
});

// questions:{question_id} - individual question data
export const r_QuizQuestionsSchema = QuizQuestionSchema;

// session:{session_id}:answers - list of a player's answers
export const r_AnswersSchema = z.object({
  questionIndex: z.number().nonnegative(),
  choiceIndex: z.array(z.number().nonnegative()).min(1),
  isCorrect: z.boolean(),
  points: z.number().default(0),
  responseMs: z.number().default(0),
  timedOut: z.boolean().default(false),
});

// metrics:{session_id} - metrics for a session
// should be submitted to the database
export const r_MetricsSchema = z.object({
  classroomQuizId: z.string().optional(),
  totalCorrect: z.number().default(0),
  totalIncorrect: z.number().default(0),
  totalResponseTime: z.number().default(0),
  longestStreak: z.number().default(0),
  currentStreak: z.number().default(0),
  hintsUsed: z.number().default(0),
});

// todo - leaderboards
