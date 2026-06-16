/**
 * Jest test suite for Quiz Create pages
 * Covers: Form validation · Draft system · AI tool calls · UI behaviour
 *
 * Run with:  npx jest createpage.test.tsx
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Mocks (must be declared before static imports) ───────────────────────────

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...rest
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src as string} alt={alt} {...rest} />
  ),
}));

// Mock all lucide-react icons as simple <svg> stubs so SVG parsing never fails
jest.mock('lucide-react', () => {
  const icon = (name: string) =>
    function MockIcon({ className }: { className?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };
  return {
    Save: icon('Save'),
    FileText: icon('FileText'),
    Plus: icon('Plus'),
    Trash2: icon('Trash2'),
    X: icon('X'),
    AlertTriangle: icon('AlertTriangle'),
    Pencil: icon('Pencil'),
    Separator: icon('Separator'),
    // Icons used by CreatePageItem and MetricsModal in createpage.tsx
    BarChart2: icon('BarChart2'),
    Clock: icon('Clock'),
    Target: icon('Target'),
    Users: icon('Users'),
    TrendingUp: icon('TrendingUp'),
    Award: icon('Award'),
  };
});

// Mock every Radix/shadcn UI primitive that DraftPopup and CreatePage use
// as simple pass-through wrappers — we test behaviour, not library internals
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    onClick,
    className,
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
    <h3>{children}</h3>
  ),
  CardDescription: ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
    <p>{children}</p>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`animate-pulse ${className ?? ''}`} />
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: ({ className }: React.HTMLAttributes<HTMLDivElement>) => (
    <span data-testid="spinner" className={className} />
  ),
}));

// ─── Static imports (after mocks) ────────────────────────────────────────────

import {
  formFingerprint,
  getDrafts,
  saveDraftToSlot,
  deleteDraftBySlot,
  type QuizFormState,
} from '@/components/createpages/draftpopup';

import DraftPopup from '@/components/createpages/draftpopup';
import { applyToolCalls } from '@/components/createpages/AiQuizPanel';
import { validateForm } from '@/components/createpages/createquiz';
import CreatePage from '@/components/createpages/createpage';

// ─── localStorage mock ────────────────────────────────────────────────────────

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
}

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const makeQuestion = (overrides = {}) => ({
  order: 0,
  type: 'multiple-choice' as const,
  question: 'What is 2+2?',
  answer: ['3', '4', '5', '6'],
  correctAnswers: [1],
  ...overrides,
});

const makeMultiSelectQuestion = (overrides = {}) => ({
  order: 0,
  type: 'multiple-select-choice' as const,
  question: 'Pick all prime numbers',
  answer: ['2', '3', '4', '5'],
  correctAnswers: [0, 1, 3],
  ...overrides,
});

const baseFormState: QuizFormState = {
  title: 'My Quiz',
  description: 'A description',
  category: 'Science',
  questions: [makeQuestion({ order: 0 }), makeQuestion({ order: 1 })],
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. FORM VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('validateForm', () => {
  describe('title validation', () => {
    it('returns no title error when title is present', () => {
      const errors = validateForm('My Quiz', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.title).toBeUndefined();
    });

    it('returns title error when title is empty string', () => {
      const errors = validateForm('', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.title).toBe('Quiz title is required');
    });

    it('returns title error when title is only whitespace', () => {
      const errors = validateForm('   ', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.title).toBe('Quiz title is required');
    });
  });

  describe('category validation', () => {
    it('returns no category error when category is selected', () => {
      const errors = validateForm('Quiz', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.category).toBeUndefined();
    });

    it('returns category error when category is empty', () => {
      const errors = validateForm('Quiz', '', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.category).toBe('Please select a category');
    });
  });

  describe('minimum questions validation', () => {
    it('passes with exactly two questions', () => {
      const errors = validateForm('Quiz', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questionsError).toBeUndefined();
    });

    it('fails with zero questions', () => {
      const errors = validateForm('Quiz', 'Science', []);
      expect(errors.questionsError).toMatch(/at least two/i);
    });

    it('fails with only one question', () => {
      const errors = validateForm('Quiz', 'Science', [
        makeQuestion({ order: 0 }),
      ]);
      expect(errors.questionsError).toMatch(/at least two/i);
    });

    it('passes with three or more questions', () => {
      const errors = validateForm('Quiz', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
        makeQuestion({ order: 2 }),
      ]);
      expect(errors.questionsError).toBeUndefined();
    });
  });

  describe('question prompt validation', () => {
    it('flags empty question prompt', () => {
      const q = makeQuestion({ order: 0, question: '' });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.question).toBe(
        'Question prompt is required'
      );
    });

    it('flags whitespace-only prompt', () => {
      const q = makeQuestion({ order: 0, question: '   ' });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.question).toMatch(/required/i);
    });

    it('does not flag a valid prompt', () => {
      const errors = validateForm('Quiz', 'Science', [
        makeQuestion({ order: 0 }),
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.question).toBeUndefined();
    });
  });

  describe('answer options validation', () => {
    it('flags fewer than 2 filled answers', () => {
      const q = makeQuestion({ order: 0, answer: ['Only one', ''] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.answer).toMatch(/at least 2/i);
    });

    it('flags empty answers array', () => {
      const q = makeQuestion({ order: 0, answer: [] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.answer).toMatch(/at least 2/i);
    });

    it('passes with 2 valid answers', () => {
      const q = makeQuestion({ order: 0, answer: ['Yes', 'No'] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.answer).toBeUndefined();
    });

    it('ignores whitespace-only answers when counting filled ones', () => {
      const q = makeQuestion({ order: 0, answer: ['  ', 'Valid', '', ''] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.answer).toMatch(/at least 2/i);
    });
  });

  describe('correctAnswers — SingleSelect', () => {
    it('passes with exactly one correct answer', () => {
      const q = makeQuestion({ order: 0, correctAnswers: [1] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toBeUndefined();
    });

    it('fails with no correct answer selected', () => {
      const q = makeQuestion({ order: 0, correctAnswers: [] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toMatch(/exactly one/i);
    });

    it('fails with more than one correct answer', () => {
      const q = makeQuestion({ order: 0, correctAnswers: [0, 1] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toMatch(/exactly one/i);
    });
  });

  describe('correctAnswers — MultiSelect', () => {
    it('passes with at least one correct answer', () => {
      const q = makeMultiSelectQuestion({ order: 0, correctAnswers: [0] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeMultiSelectQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toBeUndefined();
    });

    it('fails with zero correct answers selected', () => {
      const q = makeMultiSelectQuestion({ order: 0, correctAnswers: [] });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeMultiSelectQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toMatch(/at least one/i);
    });

    it('allows multiple correct answers', () => {
      const q = makeMultiSelectQuestion({
        order: 0,
        correctAnswers: [0, 1, 3],
      });
      const errors = validateForm('Quiz', 'Science', [
        q,
        makeMultiSelectQuestion({ order: 1 }),
      ]);
      expect(errors.questions?.[0]?.correctAnswers).toBeUndefined();
    });
  });

  describe('multiple validation errors', () => {
    it('returns all top-level errors at once rather than short-circuiting', () => {
      const errors = validateForm('', '', []);
      expect(errors.title).toBeDefined();
      expect(errors.category).toBeDefined();
      expect(errors.questionsError).toBeDefined();
    });

    it('has per-question errors keyed by question.order', () => {
      const q0 = makeQuestion({ order: 0, question: '', correctAnswers: [] });
      const q1 = makeQuestion({ order: 1, answer: ['One'] });
      const errors = validateForm('Title', 'Science', [q0, q1]);
      expect(errors.questions?.[0]?.question).toBeDefined();
      expect(errors.questions?.[0]?.correctAnswers).toBeDefined();
      expect(errors.questions?.[1]?.answer).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DRAFT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

describe('Draft system', () => {
  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    ls = mockLocalStorage();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(ls.getItem);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(ls.setItem);
    jest
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(ls.removeItem);
    jest.spyOn(Storage.prototype, 'clear').mockImplementation(ls.clear);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('formFingerprint', () => {
    it('produces identical fingerprints for equivalent forms', () => {
      expect(formFingerprint(baseFormState)).toBe(
        formFingerprint({ ...baseFormState })
      );
    });

    it('is case-insensitive for title and description', () => {
      expect(formFingerprint({ ...baseFormState, title: 'MY QUIZ' })).toBe(
        formFingerprint({ ...baseFormState, title: 'my quiz' })
      );
    });

    it('trims whitespace before comparing', () => {
      expect(formFingerprint({ ...baseFormState, title: '  My Quiz  ' })).toBe(
        formFingerprint({ ...baseFormState, title: 'My Quiz' })
      );
    });

    it('produces different fingerprints when title differs', () => {
      expect(formFingerprint({ ...baseFormState, title: 'Quiz A' })).not.toBe(
        formFingerprint({ ...baseFormState, title: 'Quiz B' })
      );
    });

    it('produces different fingerprints when a question prompt changes', () => {
      const a = formFingerprint({
        ...baseFormState,
        questions: [
          makeQuestion({ order: 0, question: 'First?' }),
          makeQuestion({ order: 1 }),
        ],
      });
      const b = formFingerprint({
        ...baseFormState,
        questions: [
          makeQuestion({ order: 0, question: 'Different?' }),
          makeQuestion({ order: 1 }),
        ],
      });
      expect(a).not.toBe(b);
    });

    it('correctAnswer order does not affect fingerprint ([0,1] === [1,0])', () => {
      const a = formFingerprint({
        ...baseFormState,
        questions: [
          makeQuestion({ order: 0, correctAnswers: [0, 1] }),
          makeQuestion({ order: 1 }),
        ],
      });
      const b = formFingerprint({
        ...baseFormState,
        questions: [
          makeQuestion({ order: 0, correctAnswers: [1, 0] }),
          makeQuestion({ order: 1 }),
        ],
      });
      expect(a).toBe(b);
    });

    it('does not throw when correctAnswers is a legacy boolean', () => {
      const form = {
        ...baseFormState,
        questions: [
          {
            ...makeQuestion({ order: 0 }),
            correctAnswers: true as unknown as number[],
          },
        ],
      };
      expect(() => formFingerprint(form)).not.toThrow();
    });

    it('does not throw when correctAnswers is a legacy string', () => {
      const form = {
        ...baseFormState,
        questions: [
          {
            ...makeQuestion({ order: 0 }),
            correctAnswers: 'Answer 1' as unknown as number[],
          },
        ],
      };
      expect(() => formFingerprint(form)).not.toThrow();
    });

    it('includes time field so different times produce different fingerprints', () => {
      const a = formFingerprint({
        ...baseFormState,
        questions: [
          { ...makeQuestion({ order: 0 }), time: 30 },
          makeQuestion({ order: 1 }),
        ],
      });
      const b = formFingerprint({
        ...baseFormState,
        questions: [
          { ...makeQuestion({ order: 0 }), time: 60 },
          makeQuestion({ order: 1 }),
        ],
      });
      expect(a).not.toBe(b);
    });
  });

  describe('saveDraftToSlot', () => {
    it('saves a draft and returns status "saved"', () => {
      expect(saveDraftToSlot(baseFormState, 0).status).toBe('saved');
    });

    it('persists the draft in localStorage', () => {
      saveDraftToSlot(baseFormState, 0);
      const drafts = getDrafts();
      expect(drafts).toHaveLength(1);
      expect(drafts[0].slotIndex).toBe(0);
      expect(drafts[0].title).toBe(baseFormState.title);
    });

    it('overwrites an existing draft in the same slot', () => {
      saveDraftToSlot(baseFormState, 0);
      saveDraftToSlot({ ...baseFormState, title: 'Updated Title' }, 0);
      const drafts = getDrafts();
      expect(drafts).toHaveLength(1);
      expect(drafts[0].title).toBe('Updated Title');
    });

    it('detects duplicates in other slots and returns status "duplicate"', () => {
      saveDraftToSlot(baseFormState, 0);
      expect(saveDraftToSlot(baseFormState, 1).status).toBe('duplicate');
    });

    it('returns status "error" when all 3 slots are full and slot is new', () => {
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 1' }, 0);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 2' }, 1);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 3' }, 2);
      expect(
        saveDraftToSlot({ ...baseFormState, title: 'Quiz 4' }, 3).status
      ).toBe('error');
    });

    it('assigns a unique draftId each time', () => {
      const r1 = saveDraftToSlot(baseFormState, 0);
      deleteDraftBySlot(0);
      const r2 = saveDraftToSlot({ ...baseFormState, title: 'Different' }, 0);
      if (r1.status === 'saved' && r2.status === 'saved') {
        expect(r1.draft.draftId).not.toBe(r2.draft.draftId);
      }
    });

    it('records a savedAt ISO timestamp', () => {
      const result = saveDraftToSlot(baseFormState, 0);
      if (result.status === 'saved') {
        expect(new Date(result.draft.savedAt).toString()).not.toBe(
          'Invalid Date'
        );
      }
    });
  });

  describe('deleteDraftBySlot', () => {
    it('removes the correct draft', () => {
      saveDraftToSlot(baseFormState, 0);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 2' }, 1);
      deleteDraftBySlot(0);
      const drafts = getDrafts();
      expect(drafts).toHaveLength(1);
      expect(drafts[0].slotIndex).toBe(1);
    });

    it('leaves other slot drafts untouched', () => {
      saveDraftToSlot(baseFormState, 0);
      deleteDraftBySlot(2);
      expect(getDrafts()).toHaveLength(1);
    });
  });

  describe('getDrafts', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(getDrafts()).toEqual([]);
    });

    it('returns empty array when localStorage value is malformed JSON', () => {
      ls.getItem.mockReturnValueOnce('{ CORRUPTED }');
      expect(() => getDrafts()).not.toThrow();
      expect(getDrafts()).toEqual([]);
    });

    it('returns parsed drafts when valid data exists', () => {
      saveDraftToSlot(baseFormState, 0);
      expect(getDrafts()).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI PANEL TOOL CALLS
// ─────────────────────────────────────────────────────────────────────────────

describe('applyToolCalls', () => {
  const q0 = makeQuestion({ order: 0, question: 'Q1?' });
  const q1 = makeQuestion({ order: 1, question: 'Q2?' });
  const baseQuestions = [q0, q1];

  describe('add_question', () => {
    it('appends a new question at the end', () => {
      const result = applyToolCalls(baseQuestions, [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'Q3?',
            answer: ['A', 'B'],
            correctAnswers: [0],
          },
        },
      ]);
      expect(result).toHaveLength(3);
      expect(result[2].question).toBe('Q3?');
    });

    it('pads the answers array to exactly 4 items', () => {
      const result = applyToolCalls(baseQuestions, [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'New?',
            answer: ['A', 'B'],
            correctAnswers: [0],
          },
        },
      ]);
      expect(result[2].answer).toHaveLength(4);
      expect(result[2].answer?.[2]).toBe('');
      expect(result[2].answer?.[3]).toBe('');
    });

    it('assigns order equal to current list length', () => {
      const result = applyToolCalls(baseQuestions, [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'New?',
            answer: ['A', 'B'],
            correctAnswers: [0],
          },
        },
      ]);
      expect(result[2].order).toBe(2);
    });
  });

  describe('edit_question', () => {
    it('patches only the targeted question', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'edit_question', order: 0, patch: { question: 'Updated Q1?' } },
      ]);
      expect(result[0].question).toBe('Updated Q1?');
      expect(result[1].question).toBe('Q2?');
    });

    it('does not change question count', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'edit_question', order: 1, patch: { correctAnswers: [2] } },
      ]);
      expect(result).toHaveLength(2);
    });

    it('is a no-op when the order does not exist', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'edit_question', order: 99, patch: { question: 'Ghost?' } },
      ]);
      expect(result[0].question).toBe('Q1?');
    });
  });

  describe('remove_question', () => {
    it('removes the targeted question', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'remove_question', order: 0 },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Q2?');
    });

    it('re-indexes remaining questions from 0', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'remove_question', order: 0 },
      ]);
      expect(result[0].order).toBe(0);
    });

    it('is a no-op when the order does not exist', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'remove_question', order: 99 },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('reorder_questions', () => {
    it('reorders questions according to newOrder', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'reorder_questions', newOrder: [1, 0] },
      ]);
      expect(result[0].question).toBe('Q2?');
      expect(result[1].question).toBe('Q1?');
    });

    it('updates the order property after reordering', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'reorder_questions', newOrder: [1, 0] },
      ]);
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
    });

    it('preserves question count', () => {
      const result = applyToolCalls(baseQuestions, [
        { tool: 'reorder_questions', newOrder: [1, 0] },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('multiple tool calls applied in sequence', () => {
    it('applies each call in order', () => {
      const result = applyToolCalls(baseQuestions, [
        {
          tool: 'add_question',
          question: {
            type: 'multiple-choice',
            question: 'Q3?',
            answer: ['A', 'B'],
            correctAnswers: [0],
          },
        },
        { tool: 'remove_question', order: 0 },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].question).toBe('Q2?');
      expect(result[1].question).toBe('Q3?');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. UI BEHAVIOUR — DraftPopup component
// ─────────────────────────────────────────────────────────────────────────────

describe('DraftPopup UI behaviour', () => {
  const onLoad = jest.fn();
  const onClose = jest.fn();

  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    ls = mockLocalStorage();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(ls.getItem);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(ls.setItem);
    jest
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(ls.removeItem);
    jest.spyOn(Storage.prototype, 'clear').mockImplementation(ls.clear);
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  const renderPopup = (overrides: Partial<QuizFormState> = {}) =>
    render(
      <DraftPopup
        formState={{ ...baseFormState, ...overrides }}
        onLoad={onLoad}
        onClose={onClose}
      />
    );

  it('FE-58: renders all 3 draft slot labels', () => {
    renderPopup();
    // Each empty slot renders "Slot N — empty"
    expect(screen.getByText(/slot 1 — empty/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 2 — empty/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 3 — empty/i)).toBeInTheDocument();
  });

  it('FE-59: shows "0 of 3 slots used" when there are no drafts', () => {
    renderPopup();
    expect(screen.getByText(/0 of 3 slots used/i)).toBeInTheDocument();
  });

  it('FE-60: calls onClose when Escape key is pressed', () => {
    renderPopup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-61: calls onClose when the × button is clicked', async () => {
    renderPopup();
    // The close button has aria-label="Close"
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-62: calls onClose when clicking the overlay backdrop directly', () => {
    renderPopup();
    const overlay = screen.getByRole('dialog');
    // Simulate click where target === currentTarget (the overlay itself, not a child)
    fireEvent.click(overlay, { target: overlay });
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-63: saves to an empty slot and updates the slot count to 1 of 3', async () => {
    renderPopup();
    // Click the first empty slot button to trigger a save
    const emptySlot = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.match(/slot 1 — empty/i));
    expect(emptySlot).toBeTruthy();
    await userEvent.click(emptySlot!);
    await waitFor(() =>
      expect(screen.getByText(/1 of 3 slots used/i)).toBeInTheDocument()
    );
  });

  it('FE-64: shows duplicate warning when same form is saved to a second slot', async () => {
    // Pre-populate slot 0 with the same content as baseFormState
    saveDraftToSlot(baseFormState, 0);
    renderPopup();
    // Try saving to slot 1 (index 1) — should trigger duplicate detection
    const emptySlots = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.match(/slot \d — empty/i));
    // First empty slot is slot 2 (slot 1 is filled)
    await userEvent.click(emptySlots[0]);
    await waitFor(() =>
      expect(screen.getByText(/duplicate draft detected/i)).toBeInTheDocument()
    );
  });

  it('FE-65: dismisses the duplicate warning when its × button is clicked', async () => {
    saveDraftToSlot(baseFormState, 0);
    renderPopup();
    const emptySlots = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.match(/slot \d — empty/i));
    await userEvent.click(emptySlots[0]);
    await screen.findByText(/duplicate draft detected/i);
    // The dismiss button inside the alert has aria-label="Dismiss"
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    await waitFor(() =>
      expect(
        screen.queryByText(/duplicate draft detected/i)
      ).not.toBeInTheDocument()
    );
  });

  it('FE-66: loads a draft and calls both onLoad and onClose', async () => {
    saveDraftToSlot(baseFormState, 0);
    renderPopup();
    // The filled slot renders the quiz title as the button text
    const filledSlotBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes(baseFormState.title));
    expect(filledSlotBtn).toBeTruthy();
    await userEvent.click(filledSlotBtn!);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-67: deletes a draft when the Delete button is clicked', async () => {
    saveDraftToSlot(baseFormState, 0);
    renderPopup();
    // Delete button has aria-label="Delete slot 1 draft"
    await userEvent.click(
      screen.getByRole('button', { name: /delete slot 1 draft/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/0 of 3 slots used/i)).toBeInTheDocument()
    );
  });

  it('FE-68: shows draft title and question count in a filled slot', () => {
    saveDraftToSlot(baseFormState, 0);
    renderPopup();
    expect(screen.getByText(baseFormState.title)).toBeInTheDocument();
    // baseFormState has 2 questions
    expect(screen.getByText(/2 questions/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CreatePage — API error states + quiz card rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('CreatePage', () => {
  afterEach(() => jest.restoreAllMocks());

  function mockFetch(responses: Array<{ ok: boolean; body: unknown }>) {
    let call = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      const r = responses[call] ?? responses[responses.length - 1];
      call++;
      return Promise.resolve({
        ok: r.ok,
        json: () => Promise.resolve(r.body),
      } as Response);
    });
  }

  it('FE-54: shows error message when the user API call fails', async () => {
    mockFetch([{ ok: false, body: {} }]);
    render(<CreatePage />);
    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong loading your quizzes/i)
      ).toBeInTheDocument()
    );
  });

  it('FE-55: shows empty state when user has no quizzes', async () => {
    mockFetch([
      { ok: true, body: { id: 'u1' } },
      { ok: true, body: { success: true, quizzes: [] } },
    ]);
    render(<CreatePage />);
    await waitFor(() =>
      expect(screen.getByText(/no quizzes yet/i)).toBeInTheDocument()
    );
  });

  it('FE-56: shows loading skeletons while data is being fetched', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<CreatePage />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0
    );
  });

  it('FE-57: navigates to /create-quiz when Create Quiz button is clicked', async () => {
    mockFetch([
      { ok: true, body: { id: 'u1' } },
      { ok: true, body: { success: true, quizzes: [] } },
    ]);
    render(<CreatePage />);
    await waitFor(() => screen.getByRole('button', { name: /create quiz/i }));
    await userEvent.click(screen.getByRole('button', { name: /create quiz/i }));
    expect(mockPush).toHaveBeenCalledWith('/create-quiz');
  });

  it('FE-69: renders quiz cards when quizzes load successfully', async () => {
    mockFetch([
      { ok: true, body: { id: 'u1' } },
      {
        ok: true,
        body: {
          success: true,
          quizzes: [
            {
              id: 'quiz-1',
              title: 'Test Quiz',
              description: 'Desc',
              imageUrl: null,
              numQuestions: 5,
              category: 'Science',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    ]);
    render(<CreatePage />);
    await waitFor(() =>
      expect(screen.getByText('Test Quiz')).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DeleteConfirmDialog — via CreatePage with one quiz loaded
// ─────────────────────────────────────────────────────────────────────────────

const mockQuiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'Desc',
  imageUrl: null,
  numQuestions: 3,
  category: 'Science',
  createdAt: new Date().toISOString(),
};

function mockWithOneQuiz(thirdCallBody?: { ok: boolean; body: unknown }) {
  let call = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    call++;
    if (call === 1)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'u1' }),
      } as Response);
    if (call === 2)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, quizzes: [mockQuiz] }),
      } as Response);
    // 3rd+ call — DELETE or metrics fetch
    const r = thirdCallBody ?? { ok: true, body: {} };
    return Promise.resolve({
      ok: r.ok,
      json: () => Promise.resolve(r.body),
    } as Response);
  });
}

describe('DeleteConfirmDialog UI behaviour', () => {
  afterEach(() => jest.restoreAllMocks());

  it('FE-73: shows delete dialog when the Delete Quiz button is clicked', async () => {
    mockWithOneQuiz();
    render(<CreatePage />);
    await userEvent.click(
      await screen.findByRole('button', { name: /delete quiz/i })
    );
    const dialog = screen
      .getByText(/delete quiz\?/i)
      .closest('div[class*="fixed"]')!;
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/test quiz/i)).toBeInTheDocument();
  });

  it('FE-74: dismisses the dialog when Cancel is clicked', async () => {
    mockWithOneQuiz();
    render(<CreatePage />);
    await userEvent.click(
      await screen.findByRole('button', { name: /delete quiz/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/delete quiz\?/i)).not.toBeInTheDocument();
  });

  it('FE-75: shows spinner and disables Cancel while delete is in flight', async () => {
    // Third fetch never resolves — freezes in deleting state
    let call = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      call++;
      if (call === 1)
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'u1' }),
        } as Response);
      if (call === 2)
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, quizzes: [mockQuiz] }),
        } as Response);
      return new Promise(() => {}); // hangs
    });

    render(<CreatePage />);
    await userEvent.click(
      await screen.findByRole('button', { name: /delete quiz/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('FE-76: removes quiz from list after successful delete', async () => {
    mockWithOneQuiz({ ok: true, body: { success: true } });
    render(<CreatePage />);
    await userEvent.click(
      await screen.findByRole('button', { name: /delete quiz/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() =>
      expect(screen.queryByText('Test Quiz')).not.toBeInTheDocument()
    );
    expect(screen.queryByText(/delete quiz\?/i)).not.toBeInTheDocument();
  });
});
