/**
 * Tests for applyToolCalls — AiQuizPanel.tsx
 *
 * applyToolCalls is a pure function so every test follows:
 *   Arrange → Act → Assert, no mocks, no side effects.
 *
 * To run:
 *   npx jest applyToolCalls.test.ts
 */

// ── Copy of the types and function from AiQuizPanel.tsx ───────────────────────
// In a real project you'd export applyToolCalls and import it directly.
// If you export it, replace this block with:
import { applyToolCalls } from '@/components/createpages/AiQuizPanel';

type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number;
  dbId?: string;
  type: QuestionType;
  time?: number;
  question: string;
  answer?: string[];
  correctAnswers: number[];
  imageUrl?: string | null;
  rawImageUrl?: string | null;
  imageRemoved?: boolean;
};

export type ToolCall =
  | { tool: 'add_question'; question: Omit<Question, 'order' | 'dbId'> }
  | {
      tool: 'edit_question';
      order: number;
      patch: Partial<Omit<Question, 'order' | 'dbId'>>;
    }
  | { tool: 'remove_question'; order: number }
  | { tool: 'reorder_questions'; newOrder: number[] };

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeQuestion(
  overrides: Partial<Question> & { order: number }
): Question {
  return {
    type: 'multiple-choice',
    question: `Question ${overrides.order}`,
    answer: ['A', 'B', 'C', 'D'],
    correctAnswers: [0],
    imageUrl: null,
    rawImageUrl: null,
    ...overrides,
  };
}

const BASE_QUESTIONS: Question[] = [
  makeQuestion({ order: 0, question: 'What is 2 + 2?' }),
  makeQuestion({ order: 1, question: 'What is the capital of France?' }),
  makeQuestion({ order: 2, question: 'What color is the sky?' }),
];

// Helper so tests can't accidentally mutate the shared fixture
function baseQuestions(): Question[] {
  return BASE_QUESTIONS.map((q) => ({ ...q, answer: [...(q.answer ?? [])] }));
}

// ── add_question ──────────────────────────────────────────────────────────────

describe('applyToolCalls — add_question', () => {
  it('appends a new question with order equal to current length', () => {
    const result = applyToolCalls(baseQuestions(), [
      {
        tool: 'add_question',
        question: {
          type: 'multiple-choice',
          question: 'New question',
          answer: ['X', 'Y'],
          correctAnswers: [0],
          imageUrl: null,
          rawImageUrl: null,
        },
      },
    ]);

    expect(result).toHaveLength(4);
    expect(result[3].order).toBe(3);
    expect(result[3].question).toBe('New question');
  });

  it('pads the answers array to exactly 4 slots', () => {
    const result = applyToolCalls(baseQuestions(), [
      {
        tool: 'add_question',
        question: {
          type: 'multiple-choice',
          question: 'Short answers',
          answer: ['Only one'],
          correctAnswers: [0],
          imageUrl: null,
          rawImageUrl: null,
        },
      },
    ]);

    const added = result[result.length - 1];
    expect(added.answer).toHaveLength(4);
    expect(added.answer).toEqual(['Only one', '', '', '']);
  });

  it('handles undefined answer by padding all 4 slots with empty strings', () => {
    const result = applyToolCalls(
      [],
      [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'No answers provided',
            answer: undefined,
            correctAnswers: [0],
            imageUrl: null,
            rawImageUrl: null,
          },
        },
      ]
    );

    expect(result[0].answer).toEqual(['', '', '', '']);
  });

  it('does not mutate the original questions array', () => {
    const original = baseQuestions();
    const snapshot = original.map((q) => ({ ...q }));

    applyToolCalls(original, [
      {
        tool: 'add_question',
        question: {
          type: 'multiple-choice',
          question: 'Mutate test',
          answer: ['A', 'B'],
          correctAnswers: [0],
          imageUrl: null,
          rawImageUrl: null,
        },
      },
    ]);

    expect(original).toEqual(snapshot);
  });

  it('adds to an empty list and assigns order 0', () => {
    const result = applyToolCalls(
      [],
      [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-select-choice',
            question: 'First ever question',
            answer: ['A', 'B'],
            correctAnswers: [0, 1],
            imageUrl: null,
            rawImageUrl: null,
          },
        },
      ]
    );

    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(0);
  });
});

// ── edit_question ─────────────────────────────────────────────────────────────

describe('applyToolCalls — edit_question', () => {
  it('applies the patch to the question matching the given order', () => {
    const result = applyToolCalls(baseQuestions(), [
      {
        tool: 'edit_question',
        order: 1,
        patch: { question: 'Updated question text' },
      },
    ]);

    expect(result[1].question).toBe('Updated question text');
  });

  it('leaves all other questions unchanged', () => {
    const original = baseQuestions();
    const result = applyToolCalls(original, [
      {
        tool: 'edit_question',
        order: 1,
        patch: { question: 'Changed' },
      },
    ]);

    expect(result[0].question).toBe(original[0].question);
    expect(result[2].question).toBe(original[2].question);
  });

  it('can change the question type via patch', () => {
    const result = applyToolCalls(baseQuestions(), [
      {
        tool: 'edit_question',
        order: 0,
        patch: { type: 'multiple-select-choice', correctAnswers: [0, 1] },
      },
    ]);

    expect(result[0].type).toBe('multiple-select-choice');
    expect(result[0].correctAnswers).toEqual([0, 1]);
  });

  it('is a no-op when the order does not match any question', () => {
    const original = baseQuestions();
    const result = applyToolCalls(original, [
      {
        tool: 'edit_question',
        order: 99,
        patch: { question: 'Ghost edit' },
      },
    ]);

    expect(result).toEqual(original);
  });

  it('does not mutate the original questions array', () => {
    const original = baseQuestions();
    const snapshot = original.map((q) => ({ ...q }));

    applyToolCalls(original, [
      { tool: 'edit_question', order: 0, patch: { question: 'Mutate check' } },
    ]);

    expect(original).toEqual(snapshot);
  });
});

// ── remove_question ───────────────────────────────────────────────────────────

describe('applyToolCalls — remove_question', () => {
  it('removes the question with the matching order', () => {
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'remove_question', order: 1 },
    ]);

    expect(result).toHaveLength(2);
    expect(
      result.find((q) => q.question === 'What is the capital of France?')
    ).toBeUndefined();
  });

  it('re-numbers remaining questions sequentially from 0', () => {
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'remove_question', order: 0 },
    ]);

    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
  });

  it('returns an empty array when the only question is removed', () => {
    const single = [makeQuestion({ order: 0, question: 'Solo' })];
    const result = applyToolCalls(single, [
      { tool: 'remove_question', order: 0 },
    ]);

    expect(result).toHaveLength(0);
  });

  it('is a no-op when the order does not match any question', () => {
    const original = baseQuestions();
    const result = applyToolCalls(original, [
      { tool: 'remove_question', order: 99 },
    ]);

    expect(result).toHaveLength(original.length);
  });

  it('does not mutate the original questions array', () => {
    const original = baseQuestions();
    const snapshot = original.map((q) => ({ ...q }));

    applyToolCalls(original, [{ tool: 'remove_question', order: 0 }]);

    expect(original).toEqual(snapshot);
  });
});

// ── reorder_questions ─────────────────────────────────────────────────────────

describe('applyToolCalls — reorder_questions', () => {
  it('reorders questions to match the newOrder array', () => {
    // Reverse order: [2, 1, 0]
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'reorder_questions', newOrder: [2, 1, 0] },
    ]);

    expect(result[0].question).toBe('What color is the sky?');
    expect(result[1].question).toBe('What is the capital of France?');
    expect(result[2].question).toBe('What is 2 + 2?');
  });

  it('assigns new sequential order indices after reorder', () => {
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'reorder_questions', newOrder: [2, 0, 1] },
    ]);

    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
    expect(result[2].order).toBe(2);
  });

  it('skips order values that do not exist in current questions', () => {
    // newOrder contains 99 which doesn't exist — should be filtered out
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'reorder_questions', newOrder: [2, 99, 0] },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].question).toBe('What color is the sky?');
    expect(result[1].question).toBe('What is 2 + 2?');
  });

  it('returns empty array when newOrder is empty', () => {
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'reorder_questions', newOrder: [] },
    ]);

    expect(result).toHaveLength(0);
  });

  it('does not mutate the original questions array', () => {
    const original = baseQuestions();
    const snapshot = original.map((q) => ({ ...q }));

    applyToolCalls(original, [
      { tool: 'reorder_questions', newOrder: [2, 1, 0] },
    ]);

    expect(original).toEqual(snapshot);
  });
});

// ── chaining multiple tool calls ──────────────────────────────────────────────

describe('applyToolCalls — chaining', () => {
  it('add then remove results in the same list as before', () => {
    const original = baseQuestions();
    const result = applyToolCalls(original, [
      {
        tool: 'add_question',
        question: {
          type: 'multiple-choice',
          question: 'Temporary',
          answer: ['A', 'B'],
          correctAnswers: [0],
          imageUrl: null,
          rawImageUrl: null,
        },
      },
      // The added question gets order = 3
      { tool: 'remove_question', order: 3 },
    ]);

    expect(result).toHaveLength(original.length);
    expect(result.map((q) => q.question)).toEqual(
      original.map((q) => q.question)
    );
  });

  it('add then edit reflects the edit on the newly added question', () => {
    const result = applyToolCalls(
      [],
      [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'Original text',
            answer: ['A', 'B'],
            correctAnswers: [0],
            imageUrl: null,
            rawImageUrl: null,
          },
        },
        {
          tool: 'edit_question',
          order: 0, // the added question lands at order 0
          patch: { question: 'Edited text' },
        },
      ]
    );

    expect(result[0].question).toBe('Edited text');
  });

  it('reorder then edit targets the question by its new order', () => {
    // After reversing [0,1,2] → [2,1,0], the old question 2 is now at order 0
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'reorder_questions', newOrder: [2, 1, 0] },
      {
        tool: 'edit_question',
        order: 0, // targets the question now at position 0 (was order 2)
        patch: { question: 'Edited after reorder' },
      },
    ]);

    expect(result[0].question).toBe('Edited after reorder');
    // The other questions are untouched
    expect(result[1].question).toBe('What is the capital of France?');
  });

  it('processes tool calls in order — later calls see the state from earlier calls', () => {
    // Remove order 0, then remove what is now order 0 (was order 1)
    const result = applyToolCalls(baseQuestions(), [
      { tool: 'remove_question', order: 0 },
      { tool: 'remove_question', order: 0 },
    ]);

    // Should be left with only the original order-2 question, now at order 0
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('What color is the sky?');
    expect(result[0].order).toBe(0);
  });
});
