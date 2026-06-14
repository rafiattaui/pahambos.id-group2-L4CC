// app/api/ai-quiz-editor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number;
  dbId?: string;
  type: QuestionType;
  time?: number;
  question: string;
  answer?: string[];
  correctAnswers: number[];
};

type ToolCall =
  | { tool: 'add_question'; question: Omit<Question, 'order' | 'dbId'> }
  | {
      tool: 'edit_question';
      order: number;
      patch: Partial<Omit<Question, 'order' | 'dbId'>>;
    }
  | { tool: 'remove_question'; order: number }
  | { tool: 'reorder_questions'; newOrder: number[] };

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

// improvements:
// add fact checking by connecting to websearch via tavily
export async function POST(req: NextRequest) {
  try {
    const { messages, questions, title, description } = await req.json();

    const { text: raw } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: buildSystemPrompt(
        questions ?? [],
        title ?? '',
        description ?? ''
      ),
      messages,
      temperature: 0.3,
      maxOutputTokens: 1500,
      providerOptions: {
        groq: { response_format: { type: 'json_object' } },
      },
    });

    let parsed: { message?: string; toolCalls?: ToolCall[] };
    try {
      // Find the first { in case the model prepends plain text before the JSON
      const jsonStart = raw.indexOf('{');
      const clean = jsonStart !== -1 ? raw.slice(jsonStart) : raw;
      parsed = JSON.parse(clean.replace(/```json|```/g, '').trim());
    } catch {
      parsed = {
        message: raw.replace(/\{[\s\S]*\}/, '').trim() || raw,
        toolCalls: [],
      };
    }

    return NextResponse.json({
      message: parsed.message ?? '',
      toolCalls: parsed.toolCalls ?? [],
    });
  } catch (err) {
    console.error('[ai-quiz-editor]', err);
    return NextResponse.json(
      { message: 'AI error. Please try again.', toolCalls: [] },
      { status: 500 }
    );
  }
}
