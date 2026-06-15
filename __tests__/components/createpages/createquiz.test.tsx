/**
 * Jest test suite for the Quiz Create pages
 * Covers: Form validation · UI behavior · Error handling
 *
 * Run with:  npx jest createpage.test.tsx
 * Requires:  jest, @testing-library/react, @testing-library/user-event,
 *            @testing-library/jest-dom, jest-environment-jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: ({
    onCropComplete,
  }: {
    onCropComplete: (a: unknown, b: unknown) => void;
  }) => {
    onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 });
    return <div data-testid="mock-cropper" />;
  },
}));

// ─── Static imports (after mocks) ────────────────────────────────────────────

import { validateForm } from '@/components/createpages/createquiz';
import {
  formFingerprint,
  getDrafts,
  saveDraftToSlot,
  deleteDraftBySlot,
  type QuizFormState,
} from '@/components/createpages/draftpopup';
import DraftPopup from '@/components/createpages/draftpopup';
import { applyToolCalls } from '@/components/createpages/AiQuizPanel';
import CreatePage from '@/components/createpages/createpage';

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
// 1. FORM VALIDATION  (validateForm from createquiz.tsx)
// ─────────────────────────────────────────────────────────────────────────────

describe('validateForm', () => {
  // ── Title ──────────────────────────────────────────────────────────────────

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

  // ── Category ───────────────────────────────────────────────────────────────

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

  // ── Questions count ────────────────────────────────────────────────────────

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

  // ── Question-level: prompt ─────────────────────────────────────────────────

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

  // ── Question-level: answers ────────────────────────────────────────────────

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

  // ── Correct answers: single-select ────────────────────────────────────────

  describe('correctAnswers for multiple-choice (single-select)', () => {
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

  // ── Correct answers: multi-select ─────────────────────────────────────────

  describe('correctAnswers for multiple-select-choice', () => {
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

  // ── Multiple errors accumulate ─────────────────────────────────────────────

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
// 2. DRAFT SYSTEM  (draftpopup helpers)
// ─────────────────────────────────────────────────────────────────────────────

describe('Draft system', () => {
  beforeEach(() => localStorage.clear());

  // ── formFingerprint ────────────────────────────────────────────────────────

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
  });

  // ── saveDraftToSlot ────────────────────────────────────────────────────────

  describe('saveDraftToSlot', () => {
    it('saves a draft and returns status "saved"', () => {
      const result = saveDraftToSlot(baseFormState, 0);
      expect(result.status).toBe('saved');
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
      const result = saveDraftToSlot(baseFormState, 1);
      expect(result.status).toBe('duplicate');
    });

    it('returns status "error" when all 3 slots are full and a new unique slot is attempted', () => {
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 1' }, 0);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 2' }, 1);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 3' }, 2);
      // slot 3 does not exist — triggers the MAX_DRAFTS guard
      const result = saveDraftToSlot({ ...baseFormState, title: 'Quiz 4' }, 3);
      expect(result.status).toBe('error');
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

  // ── deleteDraftBySlot ──────────────────────────────────────────────────────

  describe('deleteDraftBySlot', () => {
    it('removes the correct draft', () => {
      saveDraftToSlot(baseFormState, 0);
      saveDraftToSlot({ ...baseFormState, title: 'Quiz 2' }, 1);
      deleteDraftBySlot(0);
      const drafts = getDrafts();
      expect(drafts).toHaveLength(1);
      expect(drafts[0].slotIndex).toBe(1);
    });

    it('is a no-op when the slot is already empty', () => {
      saveDraftToSlot(baseFormState, 0);
      deleteDraftBySlot(2); // slot 2 was never used
      expect(getDrafts()).toHaveLength(1);
    });
  });

  // ── getDrafts ──────────────────────────────────────────────────────────────

  describe('getDrafts', () => {
    it('returns an empty array when localStorage is empty', () => {
      expect(getDrafts()).toEqual([]);
    });

    it('handles corrupted localStorage gracefully without throwing', () => {
      localStorage.setItem('quiz-drafts', '{ CORRUPTED }');
      expect(() => getDrafts()).not.toThrow();
      expect(getDrafts()).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI PANEL TOOL CALLS  (applyToolCalls from AiQuizPanel.tsx)
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
      expect(result[1].question).toBe('Q2?');
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
      // After add: [Q1(0), Q2(1), Q3(2)]; after remove order 0 (Q1): [Q2, Q3]
      expect(result).toHaveLength(2);
      expect(result[0].question).toBe('Q2?');
      expect(result[1].question).toBe('Q3?');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ERROR HANDLING — CreatePage API states
// ─────────────────────────────────────────────────────────────────────────────

describe('CreatePage error handling', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows error message when the user API call fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<CreatePage />);
    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong loading your quizzes/i)
      ).toBeInTheDocument()
    );
  });

  it('shows empty state when user has no quizzes', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, quizzes: [] }),
      } as Response);

    render(<CreatePage />);
    await waitFor(() =>
      expect(screen.getByText(/no quizzes yet/i)).toBeInTheDocument()
    );
  });

  it('shows loading skeletons while data is being fetched', () => {
    // Never resolves — keeps the component in loading state
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<CreatePage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('navigates to /create-quiz when Create Quiz button is clicked', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'u1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, quizzes: [] }),
      } as Response);

    render(<CreatePage />);
    await waitFor(() => screen.getByText(/create quiz/i));
    await userEvent.click(screen.getByRole('button', { name: /create quiz/i }));
    expect(mockPush).toHaveBeenCalledWith('/create-quiz');
  });
});
