'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types (aligned with Prisma QuizQuestion model) ───────────────────────────
//
// QuizQuestion (DB):
//   id            String    – UUID
//   quizId        String    – UUID
//   order         Int       – 1-based question number
//   question      String    – question text
//   answers       String[]  – array of answer option strings
//   correctAnswer Int       – 0-based index into `answers`
//
// `type` and `correctAnswers` are frontend-only fields not yet in the schema.
// When your schema adds a `type` column, you can remove the auto-detect fallback.

export type QuestionType = 'multiple-choice' | 'multi-select' | 'true-false';

/** Mirrors the Prisma QuizQuestion model, extended with frontend-only fields. */
export type QuizQuestion = {
  // ── DB fields ──────────────────────────────────────────────────────────────
  id: string;
  quizId: string;
  order: number; // 1-based (question 1, question 2, …)
  question: string;
  answers: string[]; // answer option strings
  correctAnswer: number; // 0-based index into `answers`

  // ── Frontend-only fields (not yet in schema) ───────────────────────────────
  type?: QuestionType; // defaults to "multiple-choice" if omitted
  correctAnswers?: number[]; // only used when type === "multi-select"
  timeLimit?: number; // seconds; defaults to 30
};

export type QuizResult = {
  questionId: string;
  order: number;
  correct: boolean;
  timeTaken: number;
};

type Props = {
  questions: QuizQuestion[];
  onComplete?: (results: QuizResult[]) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveType(q: QuizQuestion): QuestionType {
  if (q.type) return q.type;
  // Auto-detect true/false: exactly 2 answers that are "true"/"false"
  if (
    q.answers.length === 2 &&
    q.answers.every((a) => ['true', 'false'].includes(a.toLowerCase()))
  ) {
    return 'true-false';
  }
  return 'multiple-choice';
}

function checkCorrect(q: QuizQuestion, selectedIndices: number[]): boolean {
  const type = resolveType(q);

  if (type === 'multiple-choice' || type === 'true-false') {
    return selectedIndices[0] === q.correctAnswer;
  }
  if (type === 'multi-select') {
    const correctSet = q.correctAnswers ?? [q.correctAnswer];
    const sorted = [...selectedIndices].sort((a, b) => a - b);
    const sortedCorrect = [...correctSet].sort((a, b) => a - b);
    return (
      sorted.length === sortedCorrect.length &&
      sorted.every((v, i) => v === sortedCorrect[i])
    );
  }
  return false;
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const OPTION_STYLES = [
  { bg: '#e63946', shadow: '#9b1b25' },
  { bg: '#2196f3', shadow: '#0d5fa3' },
  { bg: '#f4a261', shadow: '#b56827' },
  { bg: '#2a9d8f', shadow: '#1a6b61' },
];

const TRUE_STYLE = { bg: '#2a9d8f', shadow: '#1a6b61' };
const FALSE_STYLE = { bg: '#e63946', shadow: '#9b1b25' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizInterface({ questions, onComplete }: Props) {
  // Sort by `order` so numbering always matches the DB
  const sorted = [...questions].sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const current = sorted[currentIndex];
  const timeLimit = current.timeLimit ?? 30;
  const type = resolveType(current);
  const progress = (currentIndex / sorted.length) * 100;

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted || finished) return;
    setTimeLeft(timeLimit);
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = timeLimit - elapsed;
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        handleSubmit([], timeLimit);
      } else {
        setTimeLeft(remaining);
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, submitted]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (indices: number[], forcedTimeTaken?: number) => {
      if (submitted) return;
      setSubmitted(true);

      const taken = forcedTimeTaken ?? timeLimit - timeLeft;
      setTimeTaken(taken);

      const correct = checkCorrect(current, indices);
      setResults((prev) => [
        ...prev,
        {
          questionId: current.id,
          order: current.order,
          correct,
          timeTaken: taken,
        },
      ]);
    },

    [submitted, current, timeLeft, timeLimit]
  );

  // ── Option click ───────────────────────────────────────────────────────────
  const handleOptionClick = (idx: number) => {
    if (submitted) return;

    if (type === 'multi-select') {
      setSelectedIndices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      // Single-choice & true/false: auto-submit on tap
      setSelectedIndices([idx]);
      handleSubmit([idx]);
    }
  };

  const handleMultiSubmit = () => {
    if (submitted) return;
    handleSubmit(selectedIndices);
  };

  // ── Advance / finish ───────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex + 1 >= sorted.length) {
      setFinished(true);
      onComplete?.(results);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndices([]);
      setSubmitted(false);
      setTimeTaken(0);
      setAnimKey((k) => k + 1);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const timerPct = (timeLeft / timeLimit) * 100;
  const timerColor =
    timerPct > 50 ? '#2a9d8f' : timerPct > 25 ? '#f4a261' : '#e63946';

  const lastResult = results[results.length - 1];
  const score = results.filter((r) => r.correct).length;

  const isCorrectIndex = (idx: number): boolean => {
    if (type === 'multiple-choice' || type === 'true-false') {
      return idx === current.correctAnswer;
    }
    if (type === 'multi-select') {
      return (current.correctAnswers ?? [current.correctAnswer]).includes(idx);
    }
    return false;
  };

  const typeBadgeLabel =
    type === 'multiple-choice'
      ? 'Single Choice'
      : type === 'multi-select'
        ? 'Multi Select'
        : 'True / False';

  // ── Finished screen ────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div style={styles.root}>
        <div
          style={{ ...styles.card, textAlign: 'center', padding: '3rem 2rem' }}
        >
          <div style={styles.finishEmoji}>
            {score / sorted.length >= 0.8
              ? '🏆'
              : score / sorted.length >= 0.5
                ? '🎉'
                : '💪'}
          </div>
          <h2 style={styles.finishTitle}>Quiz Complete!</h2>
          <p style={styles.finishScore}>
            {score} / {sorted.length} correct
          </p>
          <div style={styles.resultList}>
            {results.map((r) => (
              <div key={r.questionId} style={styles.resultRow}>
                <span style={styles.resultNum}>Q{r.order}</span>
                <span
                  style={{
                    ...styles.resultBadge,
                    background: r.correct ? '#2a9d8f' : '#e63946',
                  }}
                >
                  {r.correct ? '✓ Correct' : '✗ Wrong'}
                </span>
                <span style={styles.resultTime}>{r.timeTaken}s</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* ── Top bar ── */}
      <div style={styles.topBar}>
        <span style={styles.questionCounter}>
          {current.order} / {sorted.length}
        </span>

        {/* Timer ring */}
        <div style={styles.timerWrap}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#ffffff22"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={timerColor}
              strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - timerPct / 100)}`}
              style={{
                transition: 'stroke-dashoffset 0.2s linear, stroke 0.4s',
              }}
            />
          </svg>
          <span style={{ ...styles.timerText, color: timerColor }}>
            {timeLeft}
          </span>
        </div>

        <span style={styles.typeBadge}>{typeBadgeLabel}</span>
      </div>

      {/* ── Progress bar ── */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* ── Card ── */}
      <div key={animKey} style={styles.card}>
        <p style={styles.questionText}>{current.question}</p>

        {type === 'multi-select' && !submitted && (
          <p style={styles.hint}>Select all that apply, then submit.</p>
        )}

        <div style={{ ...styles.optionsGrid, gridTemplateColumns: '1fr 1fr' }}>
          {current.answers.map((optText, idx) => {
            const isTrueFalse = type === 'true-false';
            const optStyle = isTrueFalse
              ? idx === 0
                ? TRUE_STYLE
                : FALSE_STYLE
              : OPTION_STYLES[idx % OPTION_STYLES.length];

            const isSelected = selectedIndices.includes(idx);
            const showCorrect = submitted && isCorrectIndex(idx);
            const showWrong = submitted && isSelected && !isCorrectIndex(idx);

            const bg = submitted
              ? showCorrect
                ? '#00c853'
                : showWrong
                  ? '#b71c1c'
                  : '#1a1a2e'
              : optStyle.bg;

            const shadow = submitted
              ? showCorrect
                ? '#007a2e'
                : showWrong
                  ? '#7a0000'
                  : '#0d0d1a'
              : optStyle.shadow;

            const opacity = submitted && !showCorrect && !isSelected ? 0.45 : 1;

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={submitted && type !== 'multi-select'}
                style={{
                  ...styles.optionBtn,
                  background: bg,
                  boxShadow: `0 6px 0 ${shadow}`,
                  opacity,
                  transform:
                    isSelected && !submitted
                      ? 'translateY(-3px)'
                      : 'translateY(0)',
                  outline:
                    isSelected && !submitted
                      ? '3px solid white'
                      : '3px solid transparent',
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                <span style={styles.optionLabel}>{optText}</span>
                {submitted && showCorrect && (
                  <span style={styles.correctMark}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Multi-select submit */}
        {type === 'multi-select' && !submitted && (
          <button
            onClick={handleMultiSubmit}
            disabled={selectedIndices.length === 0}
            style={{
              ...styles.submitBtn,
              opacity: selectedIndices.length === 0 ? 0.4 : 1,
            }}
          >
            Submit Answer
          </button>
        )}

        {/* Result feedback */}
        {submitted && (
          <div
            style={{
              ...styles.feedback,
              background: lastResult?.correct ? '#00c85322' : '#e6394622',
              borderColor: lastResult?.correct ? '#00c853' : '#e63946',
            }}
          >
            <span style={styles.feedbackEmoji}>
              {lastResult?.correct ? '🎯' : '😬'}
            </span>
            <span style={styles.feedbackText}>
              {lastResult?.correct
                ? `Nice! +${Math.max(100, 1000 - timeTaken * 50)} pts`
                : 'Better luck next time!'}
            </span>
            <button onClick={handleNext} style={styles.nextBtn}>
              {currentIndex + 1 >= sorted.length ? 'Finish' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Fredoka', system-ui, sans-serif",
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem 1rem 3rem',
    gap: '1rem',
  },
  topBar: {
    width: '100%',
    maxWidth: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCounter: {
    color: '#ffffffaa',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    minWidth: 60,
  },
  timerWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    position: 'absolute',
    fontWeight: 900,
    fontSize: '1.15rem',
    lineHeight: 1,
  },
  typeBadge: {
    background: '#ffffff18',
    color: '#ffffffcc',
    border: '1px solid #ffffff30',
    borderRadius: 20,
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    minWidth: 90,
    textAlign: 'right',
  },
  progressTrack: {
    width: '100%',
    maxWidth: 1000,
    height: 8,
    background: '#ffffff18',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
    borderRadius: 99,
    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
  },
  card: {
    width: '100%',
    maxWidth: 1000,
    borderRadius: 20,
    padding: '8rem 8rem',
    boxShadow: '0 20px 60px #00000060',
    animation: 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  questionText: {
    color: '#fff',
    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
    fontWeight: 800,
    lineHeight: 1.4,
    margin: 0,
    textAlign: 'center',
  },
  hint: {
    color: '#ffffffaa',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: 0,
    fontStyle: 'italic',
  },
  optionsGrid: {
    display: 'grid',
    gap: '0.85rem',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 800,
    textAlign: 'left',
    transition:
      'transform 0.15s, opacity 0.3s, box-shadow 0.15s, outline 0.15s',
    position: 'relative',
  },
  optionIcon: { fontSize: '1.1rem', flexShrink: 0 },
  optionLabel: { flex: 1 },
  correctMark: { fontSize: '1.2rem', color: '#fff', fontWeight: 900 },
  submitBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '0.9rem 2rem',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    alignSelf: 'center',
    letterSpacing: '0.05em',
    transition: 'opacity 0.2s, transform 0.15s',
    boxShadow: '0 4px 0 #4a1090',
  },
  feedback: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderRadius: 12,
    border: '2px solid',
    animation: 'fadeIn 0.25s ease',
    flexWrap: 'wrap',
  },
  feedbackEmoji: { fontSize: '1.5rem' },
  feedbackText: { color: '#fff', fontWeight: 800, fontSize: '1rem', flex: 1 },
  nextBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontFamily: 'inherit',
    fontWeight: 800,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    letterSpacing: '0.04em',
  },
  finishEmoji: { fontSize: '4rem', lineHeight: 1, marginBottom: '0.5rem' },
  finishTitle: {
    color: '#fff',
    fontSize: '2rem',
    fontWeight: 900,
    margin: '0 0 0.5rem',
  },
  finishScore: {
    color: '#ec4899',
    fontSize: '1.5rem',
    fontWeight: 900,
    margin: '0 0 1.5rem',
  },
  resultList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    maxWidth: 360,
    margin: '0 auto',
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    background: '#ffffff0d',
    borderRadius: 8,
  },
  resultNum: {
    color: '#ffffffaa',
    fontWeight: 700,
    fontSize: '0.85rem',
    minWidth: 28,
  },
  resultBadge: {
    flex: 1,
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.85rem',
    borderRadius: 6,
    padding: '0.2rem 0.6rem',
  },
  resultTime: {
    color: '#ffffffaa',
    fontSize: '0.8rem',
    fontWeight: 600,
    minWidth: 28,
    textAlign: 'right',
  },
};
