import { APIError } from '@/lib/api/errors';
import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { z } from 'zod';
import { model } from '@/lib/groq';
import { generateText, Output } from 'ai';
import { type GroqLanguageModelOptions } from '@ai-sdk/groq';

const AIRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export const POST = WithAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const data = AIRequestSchema.parse(body);

    const response = await generateText({
      model,
      prompt: data.prompt,
      onFinish({ text, finishReason, usage, response, steps, totalUsage }) {
        console.log('AI response finished:', {
          text,
          finishReason,
          usage,
          response,
          steps,
          totalUsage,
        });
      },
      providerOptions: {
        groq: {} satisfies GroqLanguageModelOptions,
      },
      output: Output.object({
        schema: z.object({
          hint: z
            .string()
            .describe(
              'A hint to help the user with their question or problem.'
            ),
        }),
      }),
      system: `You are a helpful assistant that provides hints to users based on their questions or problems. Your responses should be concise and focused on providing useful hints that can guide the user towards finding a solution. Always ensure that your hints are relevant to the user's query and are easy to understand. Avoid providing direct answers; instead, aim to stimulate the user's thinking and encourage them to explore different approaches to solve their problem.`,
    });

    return NextResponse.json({
      hint: response.output.hint,
    });
  } catch (error) {
    return handleError(error);
  }
});
