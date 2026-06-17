import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { z } from 'zod';
import { model } from '@/lib/groq';
import { generateText, Output } from 'ai';
import { type GroqLanguageModelOptions } from '@ai-sdk/groq';
import redis from '@/lib/redis';
import { resolveSession } from '@/lib/quiz-session';
import { GetQuestionWithCache } from '@/lib/read-with-cache';

// --- Constants -----------------------------------------------------------

/** Max hints a user may request per question per session. */
const MAX_HINTS_PER_QUESTION = 1;

/** How long (seconds) to cache a generated hint. 1 hour matches question cache TTL. */
const HINT_CACHE_TTL_S = 60 * 60;

/** AI call hard timeout in milliseconds. */
const AI_TIMEOUT_MS = 10_000;

// --- Redis key helpers ---------------------------------------------------

const hintCacheKey = (quizId: string, questionIndex: number) =>
  `hint:quiz:${quizId}:q:${questionIndex}`;

/**
 * Single Hash per user that stores all hint rate limit counters.
 * Field: `${quizId}:q:${questionIndex}` → count
 *
 * Clearing all hints for a user is now a single DEL:
 *   redis.del(hintRateLimitHashKey(userId))
 */
const hintRateLimitHashKey = (userId: string) => `hint-rl:user:${userId}`;

const hintRateLimitField = (quizId: string, questionIndex: number) =>
  `${quizId}:q:${questionIndex}`;

// --- Route handler -------------------------------------------------------

export const GET = WithAuth(async (_req, { user }) => {
  try {
    // 1. Resolve the user's active session.
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Session is not active.' },
        { status: 400 }
      );
    }

    // 2. Load the current question.
    const question = await GetQuestionWithCache(
      session.quizId,
      session.currentQuestionIndex
    );

    if (!question) {
      return NextResponse.json(
        { success: false, message: 'Current question not found.' },
        { status: 404 }
      );
    }

    // 3. Enforce per-question hint rate limit.
    //    hincrby atomically increments the field in the hash.
    const hashKey = hintRateLimitHashKey(user.id);
    const field = hintRateLimitField(
      session.quizId,
      session.currentQuestionIndex
    );

    const hintsUsed = await redis.hincrby(hashKey, field, 1);

    if (hintsUsed === 1) {
      // First hint ever for this user — set TTL on the hash.
      // Subsequent questions extend it lazily via EXPIRE only when the key is fresh.
      await redis.expire(hashKey, HINT_CACHE_TTL_S);
    }

    if (hintsUsed > MAX_HINTS_PER_QUESTION) {
      return NextResponse.json(
        {
          success: false,
          message: `Hint limit reached. You may request at most ${MAX_HINTS_PER_QUESTION} hints per question.`,
        },
        { status: 429 }
      );
    }

    // 4. Return a cached hint if one already exists for this question.
    const cacheKey = hintCacheKey(session.quizId, session.currentQuestionIndex);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(
        { success: true, hint: cached },
        { status: 200 }
      );
    }

    // 5. Build a prompt that is helpful but does NOT leak answer indexes.
    const answerLabels = question.answers
      .map((a, i) => `${String.fromCharCode(65 + i)}. ${a}`)
      .join('\n');

    const isMultiSelect = question.type === 'MultiSelect';

    const systemPrompt = `You are a quiz assistant named Bos that gives concise, Socratic hints with a slang nature like you are a Gen Z person.
Never reveal which answer(s) are correct. Never quote answer text verbatim.
Guide the user's reasoning without giving the answer away.
Question type: ${isMultiSelect ? 'Multi-select (more than one correct answer)' : 'Single-select (exactly one correct answer)'}.`;

    const userPrompt = `Question: ${question.question}
Answer options:
${answerLabels}

Write a single, focused hint (2–3 sentences) that helps the user reason toward the answer without disclosing it.`;

    // 6. Call the AI with a hard timeout.
    const aiResult = await Promise.race([
      generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        providerOptions: {
          groq: {} satisfies GroqLanguageModelOptions,
        },
        output: Output.object({
          schema: z.object({
            hint: z
              .string()
              .describe(
                'A helpful hint to assist the user in answering the quiz question.'
              ),
          }),
        }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
      ),
    ]);

    const hint = aiResult.output.hint;

    // 7. Cache the generated hint so identical questions reuse it.
    await redis.set(cacheKey, hint, 'EX', HINT_CACHE_TTL_S);
    await redis.hset(`session:${session.id}`, 'hintsUsed', hintsUsed);

    return NextResponse.json({ success: true, hint }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          message: 'Hint generation timed out. Please try again.',
        },
        { status: 504 }
      );
    }

    return handleError(error);
  }
});
