import { r_SessionSchema } from '@/lib/schemas/sessionschemas';
import { z } from 'zod';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { APIError } from '../api/errors';
import { r_AnswersSchema, r_MetricsSchema } from '@/lib/schemas/sessionschemas';
import { generateText, Output } from 'ai';
import { model } from '@/lib/groq';
import { type GroqLanguageModelOptions } from '@ai-sdk/groq';

export async function generateFeedback(
  session: z.infer<typeof r_SessionSchema>,
  sessionId: string
) {
  const quizData = await prisma.quiz.findUnique({
    where: { id: session.quizId },
    include: {
      questions: {
        select: {
          question: true,
          type: true,
          answers: true,
          correctAnswers: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quizData) {
    throw new Error('Quiz data not found for feedback generation.');
  }

  const rawAnswers = await redis.lrange(
    `session:${sessionId}:answers`,
    0,
    quizData.numQuestions - 1
  );

  if (rawAnswers.length === 0) {
    throw new APIError('No user answers found for feedback generation.');
  }

  const rawMetrics = await redis.get(`metrics:${sessionId}`);

  // Parse answers and metrics
  const userAnswers = rawAnswers.map((a) =>
    r_AnswersSchema.parse(JSON.parse(a))
  );
  const metrics = rawMetrics
    ? r_MetricsSchema.parse(JSON.parse(rawMetrics))
    : null;

  // Build a rich per-question breakdown for the prompt
  const questionBreakdown = quizData.questions.map((q, i) => {
    const answer = userAnswers.find((a) => a.questionIndex === i);
    const correctLabels = q.correctAnswers.map((idx) => q.answers[idx]);
    const chosenLabels = answer?.choiceIndex.map((idx) => q.answers[idx]) ?? [];

    return {
      index: i + 1,
      question: q.question,
      type: q.type,
      correctAnswers: correctLabels,
      userAnswers: chosenLabels,
      isCorrect: answer?.isCorrect ?? false,
      timedOut: answer?.timedOut ?? false,
      responseMs: answer?.responseMs ?? 0,
      points: answer?.points ?? 0,
    };
  });

  const accuracyRate = metrics
    ? ((metrics.totalCorrect / quizData.numQuestions) * 100).toFixed(1)
    : 'N/A';

  const prompt = `
You are an educational coach giving constructive feedback to a student who just completed a quiz.

## Quiz Details
- Title: ${quizData.title}
- Category: ${quizData.category}
- Total Questions: ${quizData.numQuestions}
- Description: ${quizData.description ?? 'N/A'}

## Performance Summary
- Score: ${session.score} points
- Accuracy: ${accuracyRate}%
- Correct: ${metrics?.totalCorrect ?? 'N/A'} / ${quizData.numQuestions}
- Longest Streak: ${metrics?.longestStreak ?? 'N/A'}
- Hints Used: ${session.hintsUsed}
- Avg Response Time: ${
    metrics
      ? (metrics.totalResponseTime / quizData.numQuestions / 1000).toFixed(1)
      : 'N/A'
  }s per question

## Question-by-Question Breakdown
${questionBreakdown
  .map(
    (q) => `
Q${q.index}: ${q.question}
  Type: ${q.type}
  Your answer(s): ${q.userAnswers.join(', ') || '(none)'}${q.timedOut ? ' [TIMED OUT]' : ''}
  Correct answer(s): ${q.correctAnswers.join(', ')}
  Result: ${q.isCorrect ? '✓ Correct' : '✗ Incorrect'} — ${q.points} pts — ${(q.responseMs / 1000).toFixed(1)}s
`
  )
  .join('')}

## Instructions
Provide feedback in the following structure:
1. **Overall Assessment** (2-3 sentences): Summarize the student's performance tone-appropriately.
2. **Strengths** (bullet points): Topics or question types they did well on.
3. **Areas for Improvement** (bullet points): Specific questions or patterns where they struggled, with a brief explanation of the correct concept.
4. **Study Recommendations** (bullet points): Concrete next steps based on their weak areas.
5. **Encouragement** (1-2 sentences): A motivating closing remark.

Keep the tone supportive and constructive, while having a gen z style of communication. Be specific — reference actual questions and answers where helpful.
`.trim();
  let feedback: string | null = null;

  try {
    const response = await generateText({
      model,
      prompt,
      providerOptions: {
        groq: {} satisfies GroqLanguageModelOptions,
      },
      system:
        'You are a helpful and encouraging educational coach providing feedback on quiz performance.',
      output: Output.object({
        schema: z.object({
          feedback: z.string().describe('The generated feedback for the user.'),
        }),
      }),
    });

    feedback = response.output.feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw error; // or return a default feedback message if desired
  }
  return feedback; // return parsed AI response
}
