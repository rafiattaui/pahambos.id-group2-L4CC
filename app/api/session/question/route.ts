import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import redis from '@/lib/redis';
import { resolveSession } from '@/lib/quiz-session';
import { GetQuestionWithCache } from '@/lib/read-with-cache';
import { z } from 'zod';
import { r_MetricsSchema, r_AnswersSchema } from '@/lib/schemas/sessionschemas';

const TIMEOUT = 30; // seconds
export const SCORE_PER_QUESTION = 250;

const SubmitAnswerSchema = z.object({
  answer: z
    .array(z.number().nonnegative())
    .min(1, 'At least one answer must be selected'),
});

export const GET = WithAuth(async (req, { user }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for the user.' },
        { status: 404 }
      );
    }

    if (session.status === 'finished') {
      return NextResponse.json(
        { success: false, message: 'Session has already finished.' },
        { status: 400 }
      );
    }

    // if session is waiting,
    // transition it to active and set questionStartTime
    // and return question
    if (session.status === 'waiting') {
      // check if an existing answer already exists for current question

      const alreadyAnswered = await redis.lindex(
        `session:${session.id}:answers`,
        session.currentQuestionIndex
      );

      if (alreadyAnswered) {
        return NextResponse.json(
          { success: false, message: 'Current question already answered.' },
          { status: 400 }
        );
      }

      const questionStartTime = new Date().toISOString();

      const pipe = redis.pipeline();
      pipe.hset(`session:${session.id}`, 'status', 'active');
      pipe.hset(
        `session:${session.id}`,
        'questionStartTime',
        questionStartTime
      );
      await pipe.exec();

      const questionData = await GetQuestionWithCache(
        session.quizId,
        session.currentQuestionIndex
      );

      if (!questionData) {
        return NextResponse.json(
          { success: false, message: 'Question not found.' },
          { status: 404 }
        );
      }

      const { correctAnswers, ...question } = questionData;

      return NextResponse.json({
        success: true,
        question,
        questionStartTime,
      });
    }

    // status === 'active'
    const questionData = await GetQuestionWithCache(
      session.quizId,
      session.currentQuestionIndex
    );

    if (!questionData) {
      return NextResponse.json(
        { success: false, message: 'Question not found.' },
        { status: 404 }
      );
    }

    const { correctAnswers, ...question } = questionData;

    return NextResponse.json({
      success: true,
      question,
      questionStartTime: session.questionStartTime,
    });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = WithAuth(async (req, { user }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for the user.' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Session is not active.' },
        { status: 400 }
      );
    }

    // parallel — neither depends on the other
    const [questionData, rawMetrics, rawData] = await Promise.all([
      GetQuestionWithCache(session.quizId, session.currentQuestionIndex),
      redis.hgetall(`metrics:${session.id}`),
      req.json(),
    ]);

    if (!questionData) {
      return NextResponse.json(
        { success: false, message: 'Question not found.' },
        { status: 404 }
      );
    }

    const elapsedSeconds =
      (Date.now() - new Date(session.questionStartTime).getTime()) / 1000;
    const timedOut = elapsedSeconds > TIMEOUT; // hard timeout at 30 seconds

    const { answer } = SubmitAnswerSchema.parse(rawData);
    console.log('Received answer:', answer);
    console.log('Correct answers:', questionData.correctAnswers);
    console.log(
      'Types:',
      typeof answer[0],
      typeof questionData.correctAnswers[0]
    );
    console.log(
      'Strict equality:',
      answer[0] === questionData.correctAnswers[0]
    );
    console.log('timedOut:', timedOut, 'elapsedSeconds:', elapsedSeconds);

    const answeredCorrectly =
      !timedOut &&
      questionData.correctAnswers.every((a) => answer.includes(a)) &&
      answer.every((a) => questionData.correctAnswers.includes(a));

    const points = answeredCorrectly ? 250 : 0;

    const metrics = r_MetricsSchema.parse({
      totalResponseTime: parseInt(rawMetrics.totalResponseTime || '0', 10),
      totalCorrect: parseInt(rawMetrics.totalCorrect || '0', 10),
      totalIncorrect: parseInt(rawMetrics.totalIncorrect || '0', 10),
      longestStreak: parseInt(rawMetrics.longestStreak || '0', 10),
      currentStreak: parseInt(rawMetrics.currentStreak || '0', 10),
    });
    const newStreak = answeredCorrectly ? metrics.currentStreak + 1 : 0;
    console.log(newStreak, metrics.currentStreak, metrics.longestStreak);

    const answerData = r_AnswersSchema.parse({
      questionIndex: session.currentQuestionIndex,
      choiceIndex: answer,
      isCorrect: answeredCorrectly,
      points,
      responseMs: Math.round(elapsedSeconds * 1000),
      timedOut,
    });

    const pipe = redis.pipeline();
    pipe.hincrby(`session:${session.id}`, 'score', points);
    pipe.hset(`session:${session.id}`, 'status', 'waiting'); // set session to waiting for next question
    // query /next to increment question index
    pipe.hincrby(
      `metrics:${session.id}`,
      'totalResponseTime',
      Math.round(elapsedSeconds * 1000)
    );
    pipe.hincrby(
      `metrics:${session.id}`,
      'totalCorrect',
      answeredCorrectly ? 1 : 0
    );
    pipe.hincrby(
      `metrics:${session.id}`,
      'totalIncorrect',
      answeredCorrectly ? 0 : 1
    );
    pipe.hset(`metrics:${session.id}`, 'currentStreak', newStreak);
    pipe.hset(
      `metrics:${session.id}`,
      'longestStreak',
      Math.max(newStreak, metrics.longestStreak)
    );
    pipe.rpush(`session:${session.id}:answers`, JSON.stringify(answerData));
    await pipe.exec();

    return NextResponse.json({
      success: true,
      isCorrect: answeredCorrectly,
      isTimedOut: timedOut,
      points,
    });
  } catch (error) {
    return handleError(error);
  }
});
