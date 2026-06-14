import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import redis from '@/lib/redis';
import { z } from 'zod';
import { generateText, Output } from 'ai';
import { model } from '@/lib/groq';

export const AIQuizCreationSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  numQuestions: z.number().min(1).max(6),
  difficulty: z.number().min(1).max(5),
});

const QuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      question: z.string().min(5).max(100),
      type: z.enum(['MultiSelect', 'SingleSelect']),
      time: z.number().int().nonnegative(),
      answers: z.array(z.string()).min(2).max(4),
      correctAnswers: z.array(z.string()).min(1).max(4), // now expects answer text
    })
  ),
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

  const { output } = await generateText({
    model,
    system:
      'You are a helpful assistant for generating quizzes based on user input. Follow the user instructions carefully.',
    prompt: `Generate a quiz with exactly ${numQuestions} questions.

Quiz Title: "${title}"
${description ? `Quiz Description: "${description}"` : ''}
Difficulty: ${difficultyLabel} (${difficulty}/5)

Rules:
- SingleSelect: exactly 1 value in correctAnswers. MultiSelect: 2+ values, use occasionally.
- correctAnswers must be the exact answer strings from the answers array (e.g. ["60"] or ["60", "65"]).
- time in seconds: 20 for easy, 30 for medium, 45 for hard.
- order starts from 0. Do not repeat questions.`,
    output: Output.object({ schema: QuizOutputSchema }),
  });

  return output.questions.map((q) => ({
    ...q,
    correctAnswers: q.correctAnswers
      .map((answer) => q.answers.indexOf(answer))
      .filter((i) => i !== -1), // drop any that don't match
  }));
}

// POST /api/quiz/ai - Generate a quiz using AI based on user input
export const POST = WithAuth(async (req, { user }) => {
  try {
    // check if user has hit max ai rate limit
    const rate = await redis.get(`ai-ratelimit:${user.id}`);

    // limit of 5 AI quiz generations per 3 minutes per user to prevent abuse and manage costs
    if (rate && parseInt(rate) >= 5) {
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
    // set expiration for the rate limit key to 3 minutes
    await redis.expire(`ai-ratelimit:${user.id}`, 180);

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
