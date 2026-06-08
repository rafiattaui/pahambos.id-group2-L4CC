import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { z } from 'zod';
import { model } from '@/lib/groq';
import { generateText, Output } from 'ai';
import { type GroqLanguageModelOptions } from '@ai-sdk/groq';
import { resolveSession } from '@/lib/quiz-session';

export const POST = WithAuth(async (req, { user }) => {
  try {
    // grab the user's quiz session
    // get all of user's statistics from redis
    // use it to generate a prompt for the ai to generate feedback for the user
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json({
        feedback: 'No quiz session found for the user.',
      });
    }

    return NextResponse.json({
      feedback: 'This is some feedback based on your performance in the quiz.',
    });
  } catch (error) {
    return handleError(error);
  }
});
