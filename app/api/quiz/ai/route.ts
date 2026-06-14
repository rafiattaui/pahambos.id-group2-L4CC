import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import redis from '@/lib/redis';
import { z } from 'zod';
import { generateText, Output } from 'ai';
import { model } from '@/lib/groq';
import { CreateQuestionSchema } from '@/lib/schemas/quizschemas';
import {
  APICallError,
  InvalidResponseDataError,
  NoObjectGeneratedError,
} from 'ai';

export const AIQuizCreationSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  numQuestions: z.number().min(1).max(6),
  difficulty: z.number().min(1).max(5),
});

const QuizQuestionSchema = z.object({
  question: z.string(),
  answers: z.array(z.string()).min(2).max(6),
  correctAnswers: z.array(z.number()).min(1),
  type: z.enum(['SingleSelect', 'MultiSelect']),
});

async function generateQuizWithAI(
  title: string,
  description: string | undefined,
  numQuestions: number,
  difficulty: number
) {
  const difficultyLabel = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][
    difficulty - 1
  ];

  try {
    const result = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          questions: z.array(QuizQuestionSchema).length(numQuestions),
        }),
      }),
      system:
        'You are a helpful assistant for generating quizzes based on user input. Follow the user instructions carefully.',
      prompt: `Generate a quiz with exactly ${numQuestions} questions.

Quiz Title: "${title}"
${description ? `Quiz Description: "${description}"` : ''}
Difficulty: ${difficultyLabel} (${difficulty}/5)

Rules:
- SingleSelect questions must have exactly 1 index in correctAnswers.
- MultiSelect questions must have 2+ correct indexes and should appear occasionally.
- correctAnswers contains indexes into the answers array (e.g. if answer B is correct, use index 1).
- Difficulty ${difficulty}/5 should reflect question complexity and answer subtlety.
- order starts from 0.
- Do not repeat questions.`,
    });

    return result.output.questions;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      // Model failed to generate a valid object matching the schema
      console.error('No object generated:', error.message);
      throw new Error('AI failed to generate a valid quiz. Please try again.');
    }

    if (InvalidResponseDataError.isInstance(error)) {
      // Response didn't match the expected schema
      console.error('Invalid response data:', error.message);
      throw new Error('AI returned malformed data. Please try again.');
    }

    if (APICallError.isInstance(error)) {
      // Network/provider-level error (rate limit, auth, etc.)
      console.error('API call error:', error.message, error.statusCode);
      throw new Error('AI service is unavailable. Please try again later.');
    }

    throw error; // let handleError catch anything else upstream
  }
}

export const POST = WithAuth(async (req, { user }) => {
  try {
    // check if user has hit max ai rate limit
    const rate = await redis.get(`ai-ratelimit:${user.id}`);
    if (rate && parseInt(rate) >= 3) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'You have hit the maximum AI request limit. Please try again later.',
        }),
        { status: 429 }
      );
    }

    // increment the rate limit count
    await redis.incr(`ai-ratelimit:${user.id}`);
    // set expiration for the rate limit key to 1 hour
    await redis.expire(`ai-ratelimit:${user.id}`, 3600);

    // generate quiz using AI
    const rawData = await req.json();

    const { title, description, numQuestions, difficulty } =
      AIQuizCreationSchema.parse(rawData);

    const res = await generateQuizWithAI(
      title,
      description,
      numQuestions,
      difficulty
    );

    return new Response(JSON.stringify({ success: true, data: res }), {
      status: 200,
    });
  } catch (error) {
    return handleError(error);
  }
});
