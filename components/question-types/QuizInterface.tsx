'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';

export type QuestionType = 'SingleSelect' | 'MultiSelect' | 'TrueFalse';

export interface QuizQuestion {
  id: string;
  quizId: string;
  order: number; // 1-based (question 1, question 2, …)
  question: string;
  answers: string[];
  correctAnswers: number[]; // index of the correct answer in the answers array, multi select included
  imageUrl?: string;
  type?: QuestionType;
  time: number; // in seconds
}

interface AnswerResult {
  questionText: string;
  isCorrect: boolean | null;
  timedOut: boolean;
  points: number;
}

type Phase =
  | 'init' // creating session
  | 'splash' // before countdown
  | 'countdown' // 3-2-1
  | 'loading' // fetching next question
  | 'answering' // timer running
  | 'feedback' // showing correct/incorrect briefly
  | 'finishing' // calling /finish
  | 'results' // final score screen
  | 'error'; // unrecoverable error

function resolveType(q: QuizQuestion): QuestionType {
  if (q.type) return q.type;
  // Auto-detect true/false: exactly 2 answers that are "true"/"false"
  if (
    q.answers.length === 2 &&
    q.answers.every((a) => ['true', 'false'].includes(a.toLowerCase()))
  ) {
    return 'TrueFalse';
  }
  return 'SingleSelect';
}

const ANSWER_COLORS = ['#FF3B3B', '#3B82F6', '#5FAD56', '#FFD600'];
const ANSWER_TEXT_COLORS = ['#fff', '#fff', '#fff', '#fff'];

async function createSession(
  quizId: string
): Promise<{ sessionId: string; totalQuestions: number }> {
  const res = await fetch(`/api/quiz/${quizId}/session`, { method: 'POST' });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message ?? 'Failed to create session');

  const sessionRes = await fetch('/api/session');
  const sessionData = await sessionRes.json();
  if (!sessionData.success)
    throw new Error(sessionData.message ?? 'Failed to retrieve session data');

  return {
    sessionId: sessionData.sessionId,
    totalQuestions: parseInt(sessionData.sessionData.totalQuestions, 10),
  };
}

async function fetchQuestion(): Promise<{
  question: QuizQuestion;
  questionStartTime: string;
}> {
  const res = await fetch('/api/session/question', { method: 'GET' });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message ?? 'Failed to fetch question');
  return {
    question: data.question,
    questionStartTime: data.questionStartTime,
  };
}

async function submitAnswer(answer: number[]): Promise<{
  isCorrect: boolean;
  isTimedOut: boolean;
  points: number;
}> {
  const res = await fetch('/api/session/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Failed to submit answer');
  return {
    isCorrect: data.isCorrect,
    isTimedOut: data.isTimedOut,
    points: data.points,
  };
}

async function advanceQuestion(): Promise<{
  newStatus: 'active' | 'finished';
}> {
  const res = await fetch('/api/session/next', { method: 'POST' });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message ?? 'Failed to advance question');
  return { newStatus: data.newStatus };
}

async function finishSession(): Promise<void> {
  const res = await fetch('/api/session/finish', { method: 'POST' });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message ?? 'Failed to finish session');
}

// Component

export default function QuizInterface({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('init');
  const [countdown, setCountdown] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    isTimedOut: boolean;
    points: number;
    correctAnswers?: number[];
  } | null>(null);

  const [results, setResults] = useState<AnswerResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [isPaused, setIsPaused] = useState(false);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const finishMusicRef = useRef<HTMLAudioElement | null>(null);
  const submitLockRef = useRef(false); // prevent double-submit

  async function handleBackToDashboard() {
    if (phase !== 'results') {
      await fetch('/api/session', { method: 'DELETE' });
    }
    router.push('/dashboard');
  }

  // Session creation
  useEffect(() => {
    createSession(quizId)
      .then(({ totalQuestions: tq }) => {
        setTotalQuestions(tq);
        setPhase('splash');
      })
      .catch((e: any) => {
        setErrorMessage(e.message ?? 'Failed to create session');
        setPhase('error');
      });
  }, [quizId]);

  // Initialize audio once
  useEffect(() => {
    bgMusicRef.current = new Audio('/audio/quizmusic.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.2;

    finishMusicRef.current = new Audio('/audio/finishmusic.mp3');
    finishMusicRef.current.loop = true;
    finishMusicRef.current.volume = 0.2;

    return () => {
      bgMusicRef.current?.pause();
      finishMusicRef.current?.pause();
    };
  }, []);

  // React to pause/resume separately
  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio || phase == 'splash') return;
    if (isPaused || phase === 'results' || phase === 'error') {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log('Playback blocked:', err));
    }
  }, [isPaused, phase]);

  useEffect(() => {
    if (phase === 'results') {
      bgMusicRef.current?.pause();
      finishMusicRef.current?.play().catch(() => {});
    }
  }, [phase]);

  // Load question from server
  const loadQuestion = useCallback(async () => {
    setPhase('loading');
    setSelectedIndices([]);
    setLastResult(null);
    submitLockRef.current = false;
    try {
      const { question: q, questionStartTime: startTime } =
        await fetchQuestion();
      const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
      const remaining = Math.max(0, Math.floor((q.time ?? 30) - elapsed));
      setQuestion(q);
      setTimeLeft(remaining);
      setPhase('answering');
    } catch (e: any) {
      setErrorMessage(e.message ?? 'Failed to load question');
      setPhase('error');
    }
  }, []);

  const loadQuestionRef = useRef(loadQuestion);
  useEffect(() => {
    loadQuestionRef.current = loadQuestion;
  }, [loadQuestion]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      loadQuestionRef.current();
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  // Advance to next question or finish
  const doAdvance = useCallback(async () => {
    try {
      const { newStatus } = await advanceQuestion();
      if (newStatus === 'finished') {
        setPhase('finishing');
        await finishSession();
        setPhase('results');
      } else {
        setTimeout(() => {
          setQuestionIndex((i) => i + 1);
          loadQuestionRef.current();
        }, 1400);
      }
    } catch (e: any) {
      setErrorMessage(e.message);
      setPhase('error');
    }
  }, [results, loadQuestion]);

  // Handle timeout
  const handleTimeout = useCallback(async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setPhase('feedback');
    try {
      const result = await submitAnswer([0]); // although we answered 0, server detects timeout=true and marks as incorrect
      setLastResult({ ...result, isTimedOut: true, isCorrect: false });
      setResults((prev) => [
        ...prev,
        {
          questionText: question?.question ?? '',
          isCorrect: false,
          timedOut: true,
          points: 0,
        },
      ]);
      await doAdvance();
    } catch (e: any) {
      setErrorMessage(e.message);
      setPhase('error');
    }
  }, [question]);

  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  // Timer
  useEffect(() => {
    if (phase !== 'answering' || isPaused) return;
    if (timeLeft <= 0) {
      handleTimeoutRef.current();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase, isPaused]);

  // Answer submission
  const handleSubmit = useCallback(
    async (indices: number[]) => {
      if (submitLockRef.current || phase !== 'answering') return;
      submitLockRef.current = true;
      try {
        const result = await submitAnswer(indices);
        setLastResult(result);
        setResults((prev) => [
          ...prev,
          {
            questionText: question?.question ?? '',
            isCorrect: result.isCorrect,
            timedOut: result.isTimedOut,
            points: result.points,
          },
        ]);
        setTimeout(async () => {
          await doAdvance();
        }, 1400);
      } catch (e: any) {
        setErrorMessage(e.message);
        setPhase('error');
      }
      setPhase('feedback');
    },
    [phase, question, doAdvance]
  );

  // Handle selections
  function handleSingleSelect(index: number) {
    if (phase !== 'answering') return;
    setSelectedIndices([index]);
    handleSubmit([index]);
  }

  function handleMultiToggle(index: number) {
    if (phase !== 'answering') return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleMultiSubmit() {
    if (phase !== 'answering' || selectedIndices.length === 0) return;
    handleSubmit(selectedIndices);
  }

  // ── Answer button styles ───────────────────────────────────────────────────

  function getAnswerStyle(index: number) {
    const base = ANSWER_COLORS[index % ANSWER_COLORS.length];
    const isFeedback = phase === 'feedback';
    const isSelected = selectedIndices.includes(index);

    if (!isFeedback) {
      return {
        backgroundColor: base,
        opacity: 1,
        outline: isSelected ? '4px solid white' : 'none',
        outlineOffset: '2px',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
      };
    }

    if (isSelected) {
      return {
        backgroundColor: lastResult?.isCorrect ? '#00C853' : '#FF3B3B',
        opacity: 1,
      };
    }
    return { backgroundColor: base, opacity: 0.45 };
  }

  const questionType = question ? resolveType(question) : 'SingleSelect';
  const isTrueFalse = questionType === 'TrueFalse';
  const isMultiSelect = questionType === 'MultiSelect';
  const isLocked = phase === 'feedback' || phase === 'loading';

  // Init page
  if (phase === 'init') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-md">
        <div className="font-body flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-black/60">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  // Splash page
  if (phase === 'splash') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-white/30 backdrop-blur-md">
        <div className="font-body flex flex-col items-center gap-6">
          <div className="text-6xl">🎮</div>
          <h1 className="text-4xl font-black text-black">Ready?</h1>
          <p className="text-lg text-black/60">{totalQuestions} questions</p>
          <button
            onClick={() => {
              bgMusicRef.current?.play().catch(() => {});
              setCountdown(3);
              setPhase('countdown');
            }}
            className="max-w-s w-full rounded-2xl bg-blue-500 px-12 py-4 text-2xl font-bold text-white transition hover:bg-blue-600 active:scale-95"
          >
            Start Quiz 🚀
          </button>
          <button
            onClick={handleBackToDashboard}
            className="max-w-s w-full rounded-2xl border border-white/50 bg-white/30 px-12 py-4 text-center text-2xl font-bold text-black transition hover:bg-white/50 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Countdown page
  if (phase === 'countdown') {
    return (
      <div className="font-body fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white/30 backdrop-blur-md">
        <p className="text-lg text-black/50">Get ready...</p>
        <div
          key={countdown}
          className="animate-bounce text-9xl font-black text-blue-600"
        >
          {countdown}
        </div>
      </div>
    );
  }

  // Loading page
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-md">
        <div className="font-body flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-black/60">Loading question...</p>
        </div>
      </div>
    );
  }

  // Error page
  if (phase === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-white/30 px-4 backdrop-blur-md">
        <div className="text-5xl">⚠️</div>
        <h2 className="font-body text-2xl font-bold text-black">
          Something went wrong
        </h2>
        <p className="font-body max-w-sm text-center text-black/60">
          {errorMessage}
        </p>
        <button
          onClick={handleBackToDashboard}
          className="rounded-2xl bg-blue-500 px-10 py-3 font-bold text-white transition hover:bg-blue-600 active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Finishing page
  if (phase === 'finishing') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-md">
        <div className="font-body flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-black/60">Saving your results...</p>
        </div>
      </div>
    );
  }

  // Results page
  if (phase === 'results') {
    const correct = results.filter((r) => r.isCorrect).length;
    const timedOut = results.filter((r) => r.timedOut).length;
    const totalScore = results.reduce((sum, r) => sum + r.points, 0);
    const pct =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    let longestStreak = 0;
    let currentStreak = 0;
    for (const r of results) {
      if (r.isCorrect) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return (
      <div className="fixed inset-0 h-screen w-screen overflow-y-auto bg-white/30 px-4 pb-10 backdrop-blur-md">
        <div className="mt-10 mb-6 flex flex-col items-center gap-4">
          <div className="text-6xl">
            {pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '😅'}
          </div>
          <h1 className="font-body text-3xl font-bold text-black">
            Quiz Complete!
          </h1>
          <div className="font-body text-5xl font-black text-blue-600">
            {pct}%
          </div>
          <p className="font-body text-lg text-black/70">
            {correct} / {totalQuestions} correct · {timedOut} timed out
          </p>
          <p className="font-body text-2xl font-bold text-black">
            {totalScore} pts
          </p>
          {longestStreak > 1 && (
            <p className="font-body text-base text-black/60">
              🔥 Longest streak: {longestStreak}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={handleBackToDashboard}
            className="font-body mx-auto mt-5 mb-10 block w-full max-w-xl rounded-2xl border border-white/50 bg-white/30 py-4 text-center text-xl font-bold text-black transition hover:bg-white/50 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="font-body mx-auto flex max-w-xl flex-col gap-3">
          <p className="text-black/60">Review</p>
          {results.map((r, i) => {
            const icon = r.timedOut ? '⏱️' : r.isCorrect ? '✅' : '❌';
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/40 bg-white/50 px-4 py-3"
              >
                <span className="mt-0.5 text-xl">{icon}</span>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="font-body text-sm leading-snug text-black">
                    {r.questionText}
                  </span>
                  {r.points > 0 && (
                    <span className="shrink-0 text-sm font-bold text-blue-600">
                      +{r.points}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz page (answering/feedback)
  if (!question) return null;
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-y-auto bg-white/30 px-4 pb-10 backdrop-blur-md">
      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm">
          <div className="text-6xl">⏸️</div>
          <h2 className="text-3xl font-bold text-white">Game Paused</h2>
          <button
            onClick={() => setIsPaused(false)}
            className="w-full max-w-2xs rounded-2xl bg-blue-500 px-10 py-4 text-xl font-bold text-white transition hover:bg-blue-600 active:scale-95"
          >
            Resume
          </button>
          <button
            onClick={handleBackToDashboard}
            className="w-full max-w-2xs rounded-2xl border border-white/50 bg-white/20 px-10 py-4 text-center text-xl font-bold text-white transition hover:bg-white/30 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Pause button */}
      <button
        onClick={() => setIsPaused((p) => !p)}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-sm text-lg backdrop-blur-sm transition hover:bg-white/50 active:scale-95"
        title="Pause"
      >
        ⏸
      </button>

      {/* Timer bar + counters */}
      <div className="mt-6 mb-2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-body rounded-full border border-black/20 bg-blue-200 px-5 py-1 text-sm text-black backdrop-blur-md sm:text-lg">
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
          <span className="font-body rounded-full border border-black/20 bg-blue-200 px-5 py-1 text-sm text-black backdrop-blur-md sm:text-lg">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* Feedback banner */}
      {phase === 'feedback' && lastResult && (
        <div
          className={`font-body mx-auto mt-3 flex max-w-xl items-center justify-between rounded-2xl px-5 py-3 text-white transition-all ${
            lastResult.isTimedOut
              ? 'bg-orange-500'
              : lastResult.isCorrect
                ? 'bg-green-500'
                : 'bg-red-500'
          }`}
        >
          <span className="font-bold">
            {lastResult.isTimedOut
              ? "⏱️ Time's up!"
              : lastResult.isCorrect
                ? '✅ Correct!'
                : '❌ Incorrect'}
          </span>
          {lastResult.points > 0 && (
            <span className="text-lg font-black">+{lastResult.points}</span>
          )}
        </div>
      )}

      {/* Question card */}
      <div className="mx-auto mt-6 mb-6 w-full max-w-2xl rounded-3xl border border-white/30 bg-white/20 p-5 text-black shadow-2xl sm:p-12">
        {isMultiSelect && (
          <p className="text-center">
            <span className="font-body mb-5 rounded-full bg-white/70 px-3 py-1 text-xs tracking-wider text-black sm:px-4 sm:text-sm">
              Select all that apply
            </span>
          </p>
        )}
        <h2 className="font-body text-center text-sm leading-tight font-bold sm:text-xl">
          {question.question}
        </h2>
        {question.imageUrl && (
          <div className="mt-4 flex justify-center">
            <img
              src={question.imageUrl}
              alt=""
              className="max-h-30 w-full max-w-lg rounded-2xl object-contain shadow-xl"
            />
          </div>
        )}
      </div>

      {/* Answer buttons */}
      {isTrueFalse ? (
        <div className="font-body mt-5 grid grid-cols-2 gap-5 sm:mt-10 md:mt-20">
          {question.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isLocked}
              onClick={() => handleSingleSelect(index)}
              className="h-12 rounded-2xl border-black/30 px-4 py-2 text-sm font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed sm:h-40 sm:py-8 sm:text-xl"
              style={{
                ...getAnswerStyle(index),
                backgroundColor:
                  phase !== 'feedback'
                    ? index === 0
                      ? '#5FAD56'
                      : '#FF3B3B'
                    : getAnswerStyle(index).backgroundColor,
              }}
            >
              {index === 0 ? '✓' : '✗'} {answerText}
            </button>
          ))}
        </div>
      ) : isMultiSelect ? (
        <>
          <div className="font-body mt-3 mb-5 grid grid-cols-1 gap-5 sm:mt-5 sm:grid-cols-2 md:mt-10 md:grid-cols-4">
            {question.answers.map((answerText, index) => {
              const isSelected = selectedIndices.includes(index);
              return (
                <button
                  key={index}
                  disabled={isLocked}
                  onClick={() => handleMultiToggle(index)}
                  className="relative h-12 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed sm:h-35 sm:py-8 sm:text-xl"
                  style={getAnswerStyle(index)}
                >
                  <span
                    className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-md border-2 border-white/70 text-sm font-bold"
                    style={{
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.35)'
                        : 'transparent',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  {answerText}
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-5 w-full max-w-xs">
            <button
              disabled={isLocked || selectedIndices.length === 0}
              onClick={handleMultiSubmit}
              className="text-md w-full max-w-xs items-center justify-center rounded-2xl bg-blue-500 py-2 font-bold text-white transition hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed sm:py-4 sm:text-xl"
            >
              {isLocked ? 'Submitted!' : 'Confirm Selection'}
            </button>
          </div>
        </>
      ) : (
        <div className="font-body mt-20 grid grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-2 md:grid-cols-4">
          {question.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isLocked}
              onClick={() => handleSingleSelect(index)}
              className="h-15 rounded-2xl px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed sm:h-40 sm:py-8 sm:text-xl"
              style={{
                ...getAnswerStyle(index),
                color: ANSWER_TEXT_COLORS[index % ANSWER_TEXT_COLORS.length],
              }}
            >
              {answerText}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
