// app/api/ai-quiz-editor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { handleError } from '@/lib/api/errors';

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const QuestionTypeSchema = z.enum([
  'multiple-choice',
  'multiple-select-choice',
]);

const QuestionSchema = z.object({
  order: z.number().int().nonnegative(),
  dbId: z.string().optional(),
  type: QuestionTypeSchema,
  time: z.number().int().min(1).max(60).optional(),
  question: z.string().min(1),
  answer: z.array(z.string()).length(4).optional(),
  correctAnswers: z.array(z.number().int().nonnegative()),
});

// Request body schema
const RequestBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .min(1),
  questions: z.array(QuestionSchema).optional().default([]),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

// ── Tool Call Schemas ─────────────────────────────────────────────────────────

const QuestionPayloadSchema = z.object({
  type: QuestionTypeSchema,
  time: z.number().int().min(1).max(60).optional().default(30),
  question: z.string().min(1),
  answer: z.array(z.string()).length(4),
  correctAnswers: z.array(z.number().int().nonnegative()).min(1),
});

const AddQuestionToolSchema = z.object({
  tool: z.literal('add_question'),
  question: QuestionPayloadSchema,
});

const EditQuestionToolSchema = z.object({
  tool: z.literal('edit_question'),
  order: z.number().int().nonnegative(),
  patch: QuestionPayloadSchema.partial(),
});

const RemoveQuestionToolSchema = z.object({
  tool: z.literal('remove_question'),
  order: z.number().int().nonnegative(),
});

const ReorderQuestionsToolSchema = z.object({
  tool: z.literal('reorder_questions'),
  newOrder: z.array(z.number().int().nonnegative()).min(1),
});

const ToolCallSchema = z.discriminatedUnion('tool', [
  AddQuestionToolSchema,
  EditQuestionToolSchema,
  RemoveQuestionToolSchema,
  ReorderQuestionsToolSchema,
]);

// AI response schema
const AIResponseSchema = z.object({
  message: z.string(),
  toolCalls: z.array(ToolCallSchema).default([]),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

type Question = z.infer<typeof QuestionSchema>;
type ToolCall = z.infer<typeof ToolCallSchema>;
type AIResponse = z.infer<typeof AIResponseSchema>;

// ── System prompt factory ─────────────────────────────────────────────────────

function buildSystemPrompt(
  questions: Question[],
  title: string,
  description: string
): string {
  const questionSummary =
    questions.length === 0
      ? 'No questions yet.'
      : questions
          .map(
            (q) =>
              `  [order=${q.order}] "${q.question}" | type=${q.type} | options=[${(q.answer ?? []).join(', ')}] | correct indices=[${q.correctAnswers.join(', ')}] | time=${q.time ?? 30}s`
          )
          .join('\n');

  const quizContext = [
    title ? `Title: ${title}` : 'Title: (not set yet)',
    description ? `Description: ${description}` : 'Description: (not set yet)',
  ].join('\n');

  return `You are a quiz editing assistant. Your ONLY job is to help add, edit, remove, and reorder quiz questions. Do not answer general knowledge questions, have casual conversations, or discuss topics unrelated to editing this quiz. If the user asks something off-topic, politely redirect them back to quiz editing.

Quiz info:
${quizContext}

The quiz currently has these questions:

${questionSummary}

When the user asks you to make changes, respond ONLY with a JSON object — no prose before or after it.

CRITICAL: Your entire response must be a single valid JSON object with exactly two keys:
- "message": a short, friendly plain-English sentence (NO JSON, NO code, NO curly braces)
- "toolCalls": an array of tool call objects (can be empty)

Example of correct output:
{"message":"I'll add a true/false question about volcanoes.","toolCalls":[{"tool":"add_question","question":{"type":"multiple-choice","question":"Volcanoes only exist on land.","answer":["True","False","",""],"correctAnswers":[1],"time":30}}]}

TOOL CALL SCHEMA:
- add_question: {"tool":"add_question","question":{"type":"multiple-choice"|"multiple-select-choice","question":"...","answer":["opt1","opt2","opt3","opt4"],"correctAnswers":[0],"time":30}}
- edit_question: {"tool":"edit_question","order":0,"patch":{"question":"...","answer":[...],"correctAnswers":[1]}}
- remove_question: {"tool":"remove_question","order":2}
- reorder_questions: {"tool":"reorder_questions","newOrder":[2,0,1]}

RULES:
- "answer" always has exactly 4 strings (pad unused slots with "").
- "correctAnswers" are 0-based indices into "answer".
- "multiple-choice" means single correct answer — it can have up to 4 distinct options, NOT just True/False. Only use True/False options when the user explicitly asks for a true/false question.
- "multiple-select-choice" must have at least 2 real options and at least 1 correct answer index.
- Default time is 30 seconds; max 60.
- If the user is just chatting, saying thanks, acknowledging, or wrapping up (e.g. "thanks", "okay", "cool", "that's enough", "great", "perfect", "you're welcome"), respond with a friendly reply and set "toolCalls" to []. Do NOT make any changes.
- Do NOT wrap the response in markdown. Output raw JSON only.`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());
    const { messages, questions, title, description } = body;

    const { text: raw } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: buildSystemPrompt(questions, title, description),
      messages,
      temperature: 0.3,
      maxOutputTokens: 1500,
      providerOptions: {
        groq: { response_format: { type: 'json_object' } },
      },
    });

    const jsonStart = raw.indexOf('{');
    const clean = jsonStart !== -1 ? raw.slice(jsonStart) : raw;
    const parsed: AIResponse = AIResponseSchema.parse(
      JSON.parse(clean.replace(/```json|```/g, '').trim())
    );

    return NextResponse.json({
      success: true,
      message: parsed.message,
      toolCalls: parsed.toolCalls,
    });
  } catch (err) {
    return handleError(err);
  }
}
