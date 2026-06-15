/**
 * Tests for DraftPopup — DraftPopup.tsx
 *
 * DraftPopup is a React component so tests follow the standard pattern:
 *   Arrange → Act → Assert, with appropriate mocking and testing utilities.
 *
 * To run:
 *   npx jest DraftPopup.test.tsx
 */

import {
  QuizFormState,
  QuizDraft,
  formFingerprint,
  saveDraftToSlot,
  deleteDraftBySlot,
  getDrafts,
} from '@/components/createpages/draftpopup';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const makeForm = (overrides: Partial<QuizFormState> = {}): QuizFormState => ({
  title: 'My Quiz',
  description: 'A test quiz',
  category: 'science',
  questions: [
    {
      order: 0,
      type: 'multiple-choice',
      time: 30,
      question: 'What is 2+2?',
      answer: ['3', '4', '5'],
      correctAnswers: [1],
    },
  ],
  ...overrides,
});

// ─── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// ─── formFingerprint ──────────────────────────────────────────────────────────

describe('formFingerprint', () => {
  it('returns identical fingerprint for two identical forms', () => {
    const a = makeForm();
    const b = makeForm();
    expect(formFingerprint(a)).toBe(formFingerprint(b));
  });

  it('returns different fingerprint when title differs', () => {
    const a = makeForm({ title: 'Quiz A' });
    const b = makeForm({ title: 'Quiz B' });
    expect(formFingerprint(a)).not.toBe(formFingerprint(b));
  });

  it('returns different fingerprint when a question changes', () => {
    const a = makeForm();
    const b = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          time: 30,
          question: 'What is 3+3?', // different question text
          answer: ['3', '4', '5'],
          correctAnswers: [1],
        },
      ],
    });
    expect(formFingerprint(a)).not.toBe(formFingerprint(b));
  });

  it('order of correctAnswers does not affect fingerprint ([0,1] === [1,0])', () => {
    const a = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          question: 'Q',
          answer: ['A', 'B'],
          correctAnswers: [0, 1],
        },
      ],
    });
    const b = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          question: 'Q',
          answer: ['A', 'B'],
          correctAnswers: [1, 0],
        },
      ],
    });
    expect(formFingerprint(a)).toBe(formFingerprint(b));
  });

  it('does not throw when correctAnswers is a legacy boolean (migration guard)', () => {
    const form = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          question: 'Q?',
          answer: ['Yes', 'No'],
          correctAnswers: true as unknown as number[],
        },
      ],
    });
    expect(() => formFingerprint(form)).not.toThrow();
  });

  it('does not throw when correctAnswers is a legacy string (migration guard)', () => {
    const form = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          question: 'Q?',
          answer: ['Yes', 'No'],
          correctAnswers: '0' as unknown as number[],
        },
      ],
    });
    expect(() => formFingerprint(form)).not.toThrow();
  });

  it('trims and lowercases title and description before comparing', () => {
    const a = makeForm({
      title: '  My Quiz  ',
      description: '  A test quiz  ',
    });
    const b = makeForm({ title: 'MY QUIZ', description: 'A TEST QUIZ' });
    expect(formFingerprint(a)).toBe(formFingerprint(b));
  });

  it('includes time field in fingerprint so different times produce different hashes', () => {
    const a = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          time: 30,
          question: 'Q?',
          answer: ['A'],
          correctAnswers: [0],
        },
      ],
    });
    const b = makeForm({
      questions: [
        {
          order: 0,
          type: 'multiple-choice',
          time: 60,
          question: 'Q?',
          answer: ['A'],
          correctAnswers: [0],
        },
      ],
    });
    expect(formFingerprint(a)).not.toBe(formFingerprint(b));
  });
});

// ─── saveDraftToSlot ──────────────────────────────────────────────────────────

describe('saveDraftToSlot', () => {
  it('saves a new draft to an empty slot and returns status "saved"', () => {
    const result = saveDraftToSlot(makeForm(), 0);
    expect(result.status).toBe('saved');
    if (result.status === 'saved') {
      expect(result.draft.slotIndex).toBe(0);
    }
  });

  it('overwrites an existing draft in the same slot', () => {
    saveDraftToSlot(makeForm({ title: 'Old Title' }), 0);
    const result = saveDraftToSlot(makeForm({ title: 'New Title' }), 0);
    expect(result.status).toBe('saved');
    const drafts = getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('New Title');
  });

  it('returns status "duplicate" when identical content exists in another slot', () => {
    saveDraftToSlot(makeForm(), 0);
    const result = saveDraftToSlot(makeForm(), 1);
    expect(result.status).toBe('duplicate');
  });

  it('returns status "error" when all 3 slots are full and slot is new', () => {
    saveDraftToSlot(makeForm({ title: 'Quiz 1' }), 0);
    saveDraftToSlot(makeForm({ title: 'Quiz 2' }), 1);
    saveDraftToSlot(makeForm({ title: 'Quiz 3' }), 2);
    // All slots taken; trying to add a 4th unique quiz to a slot that doesn't exist
    const result = saveDraftToSlot(makeForm({ title: 'Quiz 4' }), 3);
    expect(result.status).toBe('error');
  });

  it('does not flag duplicate when saving to the same slot with same content', () => {
    saveDraftToSlot(makeForm(), 0);
    const result = saveDraftToSlot(makeForm(), 0); // same slot, same content → overwrite
    expect(result.status).toBe('saved');
  });

  it('persists to localStorage after a successful save', () => {
    saveDraftToSlot(makeForm({ title: 'Persisted Quiz' }), 0);
    const raw = localStorage.getItem('quiz-drafts');
    expect(raw).not.toBeNull();
    const parsed: QuizDraft[] = JSON.parse(raw!);
    expect(parsed[0].title).toBe('Persisted Quiz');
  });
});

// ─── deleteDraftBySlot ────────────────────────────────────────────────────────

describe('deleteDraftBySlot', () => {
  it('removes only the draft at the given slot index', () => {
    saveDraftToSlot(makeForm({ title: 'Quiz A' }), 0);
    saveDraftToSlot(makeForm({ title: 'Quiz B' }), 1);
    deleteDraftBySlot(0);
    const drafts = getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].slotIndex).toBe(1);
  });

  it('leaves other slot drafts untouched', () => {
    saveDraftToSlot(makeForm({ title: 'Quiz A' }), 0);
    saveDraftToSlot(makeForm({ title: 'Quiz B' }), 1);
    saveDraftToSlot(makeForm({ title: 'Quiz C' }), 2);
    deleteDraftBySlot(1);
    const drafts = getDrafts();
    expect(drafts.map((d) => d.slotIndex).sort()).toEqual([0, 2]);
  });

  it('is a no-op when the slot is already empty', () => {
    saveDraftToSlot(makeForm({ title: 'Quiz A' }), 0);
    deleteDraftBySlot(2); // slot 2 is empty
    expect(getDrafts()).toHaveLength(1);
  });
});

// ─── getDrafts ────────────────────────────────────────────────────────────────

describe('getDrafts', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getDrafts()).toEqual([]);
  });

  it('returns empty array when localStorage value is malformed JSON', () => {
    localStorage.setItem('quiz-drafts', '{not valid json{{');
    expect(getDrafts()).toEqual([]);
  });

  it('returns parsed drafts when valid data exists', () => {
    saveDraftToSlot(makeForm({ title: 'Stored Quiz' }), 0);
    const drafts = getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('Stored Quiz');
  });
});
