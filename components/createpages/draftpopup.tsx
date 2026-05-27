'use client';

import { Save, FileText, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

// Must stay in sync with createquiz.tsx
type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number; // DB assigns id; order is the local stable key
  type: QuestionType;
  question: string;
  answer?: string[];
  correctAnswers: number[]; // indices into answer[], matches schema's correctAnswers
};

export type QuizFormState = {
  coverUrl?: string | null;
  title: string;
  description: string;
  category: string;
  questions: Question[];
};

export type QuizDraft = QuizFormState & {
  draftId: string;
  slotIndex: number;
  savedAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DRAFTS = 3;
const DRAFTS_KEY = 'quiz-drafts';

// ─── Duplicate detection ──────────────────────────────────────────────────────

/**
 * Produces a stable fingerprint of the form content (ignores metadata like
 * draftId, slotIndex, savedAt so we compare only the actual quiz data).
 */
function formFingerprint(form: QuizFormState): string {
  const normalized = {
    title: form.title.trim().toLowerCase(),
    description: form.description.trim().toLowerCase(),
    category: form.category,
    questions: form.questions.map((q) => {
      // Defensive normalization: old drafts in localStorage may still have
      // correctAnswers as string | string[] | boolean from before the refactor.
      const ca = q.correctAnswers;
      const normalized_ca: number[] = Array.isArray(ca)
        ? (ca as unknown[]).map(Number)
        : typeof ca === 'boolean' || ca === undefined || ca === null
          ? []
          : [Number(ca)];

      return {
        type: q.type,
        question: q.question.trim().toLowerCase(),
        answer: q.answer?.map((a) => a.trim().toLowerCase()).sort(),
        correctAnswers: normalized_ca.sort((a, b) => a - b).join('|'),
      };
    }),
  };
  return JSON.stringify(normalized);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function getDrafts(): QuizDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as QuizDraft[]) : [];
  } catch {
    return [];
  }
}

function persistDrafts(drafts: QuizDraft[]): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// ─── Core save logic (exported so the parent can call it too) ─────────────────

export type SaveResult =
  | { status: 'saved'; draft: QuizDraft }
  | { status: 'duplicate'; conflictSlot: number }
  | { status: 'error'; message: string };

export function saveDraftToSlot(
  form: QuizFormState,
  slotIndex: number
): SaveResult {
  const drafts = getDrafts();
  const fingerprint = formFingerprint(form);

  // Check for duplicates in OTHER slots
  const duplicate = drafts.find(
    (d) => d.slotIndex !== slotIndex && formFingerprint(d) === fingerprint
  );

  if (duplicate) {
    return { status: 'duplicate', conflictSlot: duplicate.slotIndex + 1 };
  }

  const newDraft: QuizDraft = {
    ...form,
    draftId: crypto.randomUUID(),
    slotIndex,
    savedAt: new Date().toISOString(),
  };

  const existingIdx = drafts.findIndex((d) => d.slotIndex === slotIndex);
  if (existingIdx !== -1) {
    drafts[existingIdx] = newDraft;
  } else {
    if (drafts.length >= MAX_DRAFTS) {
      return {
        status: 'error',
        message: 'All 3 draft slots are full. Delete one first.',
      };
    }
    drafts.push(newDraft);
  }

  persistDrafts(drafts);
  return { status: 'saved', draft: newDraft };
}

export function deleteDraftBySlot(slotIndex: number): void {
  persistDrafts(getDrafts().filter((d) => d.slotIndex !== slotIndex));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DuplicateAlert({
  conflictSlot,
  onDismiss,
}: {
  conflictSlot: number;
  onDismiss: () => void;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1 text-sm">
        <p className="font-body font-medium text-amber-800">
          Duplicate draft detected
        </p>
        <p className="font-body mt-0.5 text-amber-700">
          This quiz is already saved in slot {conflictSlot}. Save a different
          version or delete the existing draft first.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-amber-500 hover:text-amber-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SlotCard({
  slotIndex,
  draft,
  onSave,
  onLoad,
  onDelete,
}: {
  slotIndex: number;
  draft: QuizDraft | null;
  onSave: (slotIndex: number) => void;
  onLoad: (draft: QuizDraft) => void;
  onDelete: (slotIndex: number) => void;
}) {
  const qCount = draft?.questions?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 transition-colors hover:border-gray-300">
      {/* Main clickable area */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
        onClick={() => (draft ? onLoad(draft) : onSave(slotIndex))}
      >
        {/* Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            draft
              ? 'bg-blue-50 text-blue-500'
              : 'border border-dashed border-gray-300 bg-gray-50 text-gray-400'
          }`}
        >
          {draft ? (
            <FileText className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          {draft ? (
            <>
              <p className="font-body truncate text-sm font-medium text-gray-900">
                {draft.title || 'Untitled quiz'}
              </p>
              <p className="font-body mt-0.5 text-xs text-gray-500">
                {qCount} question{qCount !== 1 ? 's' : ''} &nbsp;·&nbsp;{' '}
                {formatDate(draft.savedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="font-body text-sm font-medium text-gray-400">
                Slot {slotIndex + 1} — empty
              </p>
              <p className="font-body mt-0.5 text-xs text-gray-400">
                Click to save current draft here
              </p>
            </>
          )}
        </div>

        {/* Chevron (filled slots only) */}
        {draft && (
          <svg
            className="h-4 w-4 shrink-0 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </button>

      {/* Footer (filled slots only) */}
      {draft && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-1.5">
          <span className="font-body text-xs text-gray-400">
            Click to load this draft
          </span>
          <button
            type="button"
            onClick={() => onDelete(slotIndex)}
            className="font-body flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete slot ${slotIndex + 1} draft`}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type DraftPopupProps = {
  /** Current form state to save */
  formState: QuizFormState;
  /** Called when a draft is loaded — parent should hydrate form fields */
  onLoad: (draft: QuizDraft) => void;
  /** Called to close the popup */
  onClose: () => void;
};

export default function DraftPopup({
  formState,
  onLoad,
  onClose,
}: DraftPopupProps) {
  const [drafts, setDrafts] = useState<QuizDraft[]>(getDrafts);
  const [duplicateConflict, setDuplicateConflict] = useState<number | null>(
    null
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onStorage = () => setDrafts(getDrafts());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const refresh = () => setDrafts(getDrafts());

  const handleSave = (slotIndex: number) => {
    setDuplicateConflict(null);
    const result = saveDraftToSlot(formState, slotIndex);

    if (result.status === 'duplicate') {
      setDuplicateConflict(result.conflictSlot);
    }

    if (result.status === 'error') {
      alert(result.message);
      return;
    }

    refresh();
    setTimeout(() => onClose(), 700);
  };

  const handleLoad = (draft: QuizDraft) => {
    onLoad(draft);
    onClose();
  };

  const handleDelete = (slotIndex: number) => {
    deleteDraftBySlot(slotIndex);
    setDuplicateConflict(null);
    refresh();
  };

  const draftMap = Object.fromEntries(drafts.map((d) => [d.slotIndex, d]));
  const filledCount = drafts.length;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-popup-title"
    >
      {/* Panel */}
      <div className="animate-in fade-in slide-in-from-bottom-2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl duration-200">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Save className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="draft-popup-title"
                className="font-body text-sm font-bold text-gray-900"
              >
                Draft slots
              </h2>
              <p className="font-body text-xs text-gray-500">
                {filledCount} of {MAX_DRAFTS} slots used
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate alert */}
        {duplicateConflict !== null && (
          <DuplicateAlert
            conflictSlot={duplicateConflict}
            onDismiss={() => setDuplicateConflict(null)}
          />
        )}

        {/* Slots */}
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: MAX_DRAFTS }, (_, i) => (
            <SlotCard
              key={i}
              slotIndex={i}
              draft={draftMap[i] ?? null}
              onSave={handleSave}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="font-body mt-4 text-center text-xs text-gray-400">
          Drafts are stored locally in your browser
        </p>
      </div>
    </div>
  );
}
