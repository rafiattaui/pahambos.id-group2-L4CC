'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';
import { r_SessionSchema } from '@/lib/schemas/sessionschemas';
import { z } from 'zod';

export type QuestionType = 'SingleSelect' | 'MultiSelect' | 'TrueFalse';

export interface QuizQuestion {
  id: string;
  quizId: string;
  order: number;
  question: string;
  answers: string[];
  correctAnswers: number[];
  imageUrl?: string;
  type?: QuestionType;
  time: number;
}

interface AnswerResult {
  questionText: string;
  isCorrect: boolean | null;
  timedOut: boolean;
  points: number;
}

const c_SessionSchema = r_SessionSchema.extend({
  id: z.string(),
  userId: z.string().optional(),
});

type Phase =
  | 'init'
  | 'splash'
  | 'countdown'
  | 'answering'
  | 'feedback'
  | 'finishing'
  | 'results'
  | 'leaderboard'
  | 'error';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  total: number;
  isCurrentUser: boolean;
}

function resolveType(q: QuizQuestion): QuestionType {
  if (q.type) return q.type;
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

// ── Shared animated background ───────────────────────────────────────────────

const GRID_ICONS = ['✏️', '📚', '📖', '📝', '✏️', '📚', '📝', '📖'];
const CELL = 90; // px — cell size for both icon spacing and grid lines
const COLS = Math.ceil(1920 / CELL) + 2; // enough columns to cover any viewport
const ROWS = Math.ceil(1080 / CELL) + 3; // +3 so the looping extra rows are invisible

function AnimatedBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #e0f2fe 100%)',
      }}
    >
      {/* Keyframes injected once */}
      <style>{`
        @keyframes gridSlide {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(${CELL}px); }
        }
        .bg-icon-grid {
          animation: gridSlide 2s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Icon + gridline layer — sits behind content */}
      <div
        className="bg-icon-grid pointer-events-none absolute"
        style={{
          /* Start one full cell above the viewport so the loop is invisible */
          top: -CELL * 2,
          left: 0,
          width: '100%',
          /* Tall enough to fill the screen even after shifting up by CELL px */
          height: `${(ROWS + 2) * CELL}px`,
          /* Grid lines */
          backgroundImage: `
            linear-gradient(rgba(99,149,210,0.13) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,149,210,0.13) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL}px ${CELL}px`,
        }}
      >
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => (
            <span
              key={`${row}-${col}`}
              className="pointer-events-none absolute select-none"
              style={{
                left: col * CELL + (CELL - 28) / 2,
                top: row * CELL + (CELL - 28) / 2,
                fontSize: 22,
                opacity: 0.18,
                lineHeight: 1,
              }}
            >
              {GRID_ICONS[(row * COLS + col) % GRID_ICONS.length]}
            </span>
          ))
        )}
      </div>

      {/* Content on top */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

// ── Glass card helper ─────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow:
          '0 25px 60px rgba(99,149,210,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {children}
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function createSession(
  quizId: string
): Promise<{ sessionId: string; totalQuestions: number; userId: string }> {
  const res = await fetch(`/api/quiz/${quizId}/session`, { method: 'POST' });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message ?? 'Failed to create session');

  const sessionRes = await fetch('/api/session');
  const rawData = await sessionRes.json();
  const session = c_SessionSchema.parse(rawData.session);
  if (!session) throw new Error('Failed to retrieve session data');

  console.log(session);

  return {
    sessionId: session.id,
    totalQuestions: session.totalQuestions,
    userId: session.userId ?? '',
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
  return { question: data.question, questionStartTime: data.questionStartTime };
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

// ── Main component ────────────────────────────────────────────────────────────

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
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] =
    useState<LeaderboardEntry | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const finishMusicRef = useRef<HTMLAudioElement | null>(null);
  const submitLockRef = useRef(false); // prevent double-submit
  const hintLockRef = useRef(false); // prevent double hint request

  async function handleBackToDashboard() {
    if (phase !== 'results' && phase !== 'leaderboard') {
      await fetch('/api/session', { method: 'DELETE' });
    }
    router.push('/dashboard');
  }

  async function fetchLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/${quizId}`, { method: 'GET' });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message ?? 'Failed to fetch leaderboard');

      // data.data is an array of { rank, userId, userName, finalScore }
      const entries: {
        rank: number;
        userId: string;
        userName: string;
        finalScore: number;
      }[] = Array.isArray(data.data) ? data.data : [];

      // Identify the current user by matching userId captured at session start
      const mapped: LeaderboardEntry[] = entries.map((entry) => ({
        rank: entry.rank,
        name: entry.userName,
        score: entry.finalScore,
        total: totalQuestions,
        isCurrentUser: currentUserId !== '' && entry.userId === currentUserId,
      }));

      const top5 = mapped.slice(0, 5);
      setLeaderboard(top5);

      // If current user exists but isn't in the top 5, surface them below
      const me = mapped.find((e) => e.isCurrentUser);
      const meInTop5 = top5.some((e) => e.isCurrentUser);
      setCurrentUserRank(me && !meInTop5 ? me : null);
    } catch (e: any) {
      console.error('Leaderboard fetch error:', e);
      setLeaderboard([]);
      setCurrentUserRank(null);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  // Session creation
  useEffect(() => {
    createSession(quizId)
      .then(({ totalQuestions: tq, userId }) => {
        setTotalQuestions(tq);
        setCurrentUserId(userId);
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

  // Pause/resume audio based on phase
  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio || phase == 'splash') return;
    if (phase === 'results' || phase === 'leaderboard' || phase === 'error') {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log('Playback blocked:', err));
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'results' || phase === 'leaderboard') {
      bgMusicRef.current?.pause();
      finishMusicRef.current?.play().catch(() => {});
    }
  }, [phase]);

  // Load question from server
  const loadQuestion = useCallback(async () => {
    setSelectedIndices([]);
    setLastResult(null);
    setHint(null);
    setHintLoading(false);
    setHintUsed(false);
    hintLockRef.current = false;
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
    if (phase !== 'answering') return;
    if (timeLeft <= 0) {
      handleTimeoutRef.current();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

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

  async function fetchHint() {
    if (hintLockRef.current) return;
    hintLockRef.current = true;
    setHintLoading(true);
    setHintUsed(true);
    try {
      const res = await fetch('/api/session/hint', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) {
        console.error('Hint API error:', res.status, data);
        setHint(data?.message ?? 'Failed to load hint.');
        return;
      }
      setHint(data.hint ?? 'No hint available.');
    } catch (e) {
      console.error('Hint fetch error:', e);
      setHint('Could not load hint. Try again.');
    } finally {
      setHintLoading(false);
    }
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
  const isLocked = phase === 'feedback';

  // ── Init ──────────────────────────────────────────────────────────────────

  if (phase === 'init') {
    return (
      <AnimatedBackground>
        <div className="flex h-full items-center justify-center">
          <GlassCard className="flex flex-col items-center gap-4 px-12 py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            <p className="font-body text-black/50">Preparing your quiz...</p>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  // ── Splash ────────────────────────────────────────────────────────────────

  if (phase === 'splash') {
    return (
      <AnimatedBackground>
        <div className="flex h-full items-center justify-center px-4">
          <GlassCard className="font-body flex w-full max-w-sm flex-col items-center gap-6 px-10 py-12">
            <div className="text-6xl drop-shadow-lg">🎮</div>
            <h1 className="text-4xl font-black text-gray-800 drop-shadow">
              Ready?
            </h1>
            <p className="text-lg text-black/50">{totalQuestions} questions</p>
            <button
              onClick={() => {
                bgMusicRef.current?.play().catch(() => {});
                setCountdown(3);
                setPhase('countdown');
              }}
              className="w-full rounded-2xl bg-blue-500 px-12 py-4 text-2xl font-bold text-white transition hover:bg-blue-400 active:scale-95"
              style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.5)' }}
            >
              Start Quiz 🚀
            </button>
            <button
              onClick={handleBackToDashboard}
              className="w-full rounded-2xl bg-orange-500 px-12 py-4 text-center text-2xl font-bold text-white transition hover:bg-orange-400 active:scale-95"
              style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.4)' }}
            >
              Back to Dashboard
            </button>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  // ── Countdown ─────────────────────────────────────────────────────────────

  if (phase === 'countdown') {
    return (
      <AnimatedBackground>
        <div className="font-body flex h-full flex-col items-center justify-center gap-4">
          <p className="text-lg text-black/40">Get ready...</p>
          <div
            key={countdown}
            className="animate-bounce text-9xl font-black text-blue-500"
          >
            {countdown}
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (phase === 'error') {
    return (
      <AnimatedBackground>
        <div className="flex h-full items-center justify-center px-4">
          <GlassCard className="flex flex-col items-center gap-6 px-10 py-12">
            <div className="text-5xl">⚠️</div>
            <h2 className="font-body text-2xl font-bold text-gray-800">
              Something went wrong
            </h2>
            <p className="font-body max-w-sm text-center text-black/50">
              {errorMessage}
            </p>
            <button
              onClick={handleBackToDashboard}
              className="rounded-2xl bg-blue-500 px-10 py-3 font-bold text-white transition hover:bg-blue-400 active:scale-95"
            >
              Back to Dashboard
            </button>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  // ── Finishing ─────────────────────────────────────────────────────────────

  if (phase === 'finishing') {
    return (
      <AnimatedBackground>
        <div className="flex h-full items-center justify-center">
          <GlassCard className="flex flex-col items-center gap-4 px-12 py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            <p className="font-body text-black/50">Saving your results...</p>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────

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
      <AnimatedBackground>
        <div className="h-full w-full overflow-y-auto px-4 pb-10">
          {/* Score header */}
          <div className="mt-10 mb-6 flex flex-col items-center gap-4">
            <div className="text-6xl">
              {pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '😅'}
            </div>
            <h1 className="font-body text-3xl font-bold text-gray-800">
              Quiz Complete!
            </h1>
            <div className="font-body text-5xl font-black text-blue-600">
              {pct}%
            </div>
            <p className="font-body text-lg text-black/60">
              {correct} / {totalQuestions} correct · {timedOut} timed out
            </p>
            <p className="font-body text-2xl font-bold text-gray-800">
              {totalScore} pts
            </p>
            {longestStreak > 1 && (
              <p className="font-body text-base text-black/50">
                🔥 Longest streak: {longestStreak}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                setPhase('leaderboard');
                fetchLeaderboard();
              }}
              className="font-body mx-auto mt-5 mb-10 block w-full max-w-xl rounded-2xl bg-blue-500 py-4 text-center text-xl font-bold text-white transition hover:bg-blue-400 active:scale-95"
              style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.4)' }}
            >
              Continue 🏆
            </button>
          </div>

          {/* Review list */}
          <div className="font-body mx-auto flex max-w-xl flex-col gap-3">
            <p className="text-black/40">Review</p>
            {results.map((r, i) => {
              const icon = r.timedOut ? '⏱️' : r.isCorrect ? '✅' : '❌';
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.07)',
                  }}
                >
                  <span className="mt-0.5 text-xl">{icon}</span>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="font-body text-sm leading-snug text-gray-700">
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
      </AnimatedBackground>
    );
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  if (phase === 'leaderboard') {
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const rankColors = [
      {
        bg: 'rgba(255,215,0,0.15)',
        border: 'rgba(255,193,7,0.4)',
        text: '#92660a',
      },
      {
        bg: 'rgba(192,192,192,0.15)',
        border: 'rgba(180,180,180,0.4)',
        text: '#555',
      },
      {
        bg: 'rgba(205,127,50,0.15)',
        border: 'rgba(180,100,30,0.35)',
        text: '#7a4a1e',
      },
      {
        bg: 'rgba(255,255,255,0.5)',
        border: 'rgba(0,0,0,0.07)',
        text: '#374151',
      },
      {
        bg: 'rgba(255,255,255,0.5)',
        border: 'rgba(0,0,0,0.07)',
        text: '#374151',
      },
    ];

    return (
      <AnimatedBackground>
        <div className="flex h-full w-full flex-col items-center overflow-y-auto px-4 pt-10 pb-10">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="text-5xl">🏆</div>
            <h1 className="font-body text-3xl font-black text-gray-800">
              Leaderboard
            </h1>
            <p className="font-body text-sm text-black/40">
              Top 5 scores for this quiz
            </p>
          </div>

          <div className="w-full max-w-lg">
            {leaderboardLoading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
                <p className="font-body text-sm text-black/40">
                  Loading scores...
                </p>
              </div>
            ) : leaderboard.length === 0 ? (
              <GlassCard className="flex flex-col items-center gap-2 px-8 py-10">
                <div className="text-4xl">📭</div>
                <p className="font-body text-center text-black/50">
                  No scores yet. You might be the first!
                </p>
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-3">
                {leaderboard.map((entry) => {
                  const colors = rankColors[entry.rank - 1] ?? rankColors[4];
                  return (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-4 rounded-2xl px-5 py-4 transition"
                      style={{
                        background: entry.isCurrentUser
                          ? 'rgba(59,130,246,0.12)'
                          : colors.bg,
                        border: `1px solid ${entry.isCurrentUser ? 'rgba(59,130,246,0.4)' : colors.border}`,
                        boxShadow:
                          entry.rank === 1
                            ? '0 4px 20px rgba(255,193,7,0.2)'
                            : undefined,
                      }}
                    >
                      {/* Medal / rank */}
                      <span className="text-2xl leading-none">
                        {medals[entry.rank - 1]}
                      </span>

                      {/* Name */}
                      <div className="flex flex-1 flex-col">
                        <span
                          className="font-body leading-tight font-bold"
                          style={{
                            color: entry.isCurrentUser
                              ? '#1d4ed8'
                              : colors.text,
                          }}
                        >
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                              You
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Score */}
                      <span
                        className="font-body text-xl font-black"
                        style={{
                          color: entry.isCurrentUser ? '#1d4ed8' : colors.text,
                        }}
                      >
                        {entry.score} pts
                      </span>
                    </div>
                  );
                })}

                {/* Current user rank — shown only when outside the top 5 */}
                {currentUserRank && (
                  <>
                    {/* Ellipsis separator */}
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-px flex-1 bg-black/10" />
                      <span className="font-body text-xs text-black/30">
                        •••
                      </span>
                      <div className="h-px flex-1 bg-black/10" />
                    </div>

                    <div
                      className="flex items-center gap-4 rounded-2xl px-5 py-4"
                      style={{
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.4)',
                      }}
                    >
                      {/* Rank number */}
                      <span className="font-body w-8 text-center text-lg font-black text-blue-400">
                        #{currentUserRank.rank}
                      </span>

                      {/* Name */}
                      <div className="flex flex-1 flex-col">
                        <span className="font-body leading-tight font-bold text-blue-700">
                          {currentUserRank.name}
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            You
                          </span>
                        </span>
                        <span className="font-body text-xs text-black/40">
                          Your rank
                        </span>
                      </div>

                      {/* Score */}
                      <span className="font-body text-xl font-black text-blue-700">
                        {currentUserRank.score} pts
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleBackToDashboard}
              className="font-body mt-8 w-full rounded-2xl bg-orange-500 py-4 text-center text-xl font-bold text-white transition hover:bg-orange-400 active:scale-95"
              style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.35)' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  if (!question) return null;

  return (
    <AnimatedBackground>
      <div className="h-full w-full overflow-y-auto px-4 pb-10">
        {/* Back to Dashboard button */}
        <button
          onClick={handleBackToDashboard}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-lg transition hover:bg-black/10 active:scale-95"
          title="Back to Dashboard"
        >
          🏠
        </button>

        {/* Timer + counter pills */}
        <div className="mt-6 mb-2 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className="font-body rounded-full px-5 py-1 text-sm text-blue-700 sm:text-lg"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
            <span
              className="font-body rounded-full px-5 py-1 text-sm text-blue-700 sm:text-lg"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
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
        <GlassCard className="mx-auto mt-6 mb-6 w-full max-w-2xl p-5 sm:p-12">
          {isMultiSelect && (
            <p className="text-center">
              <span className="font-body mb-5 rounded-full bg-blue-100 px-3 py-1 text-xs tracking-wider text-blue-700 sm:px-4 sm:text-sm">
                Select all that apply
              </span>
            </p>
          )}
          <h2 className="font-body text-center text-sm leading-tight font-bold text-gray-800 sm:text-xl">
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

          {/* Hint section */}
          {phase === 'answering' && (
            <div className="mt-5 flex flex-col items-center gap-3">
              {!hintUsed && (
                <button
                  onClick={fetchHint}
                  className="font-body flex items-center gap-2 rounded-full border border-yellow-400/60 bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-200 active:scale-95"
                >
                  💡 Get a Hint
                </button>
              )}
              {hintLoading && (
                <div className="font-body flex items-center gap-2 text-sm text-black/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
                  Thinking of a hint…
                </div>
              )}
              {hint && !hintLoading && (
                <div className="font-body w-full rounded-2xl border border-yellow-400/40 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-800">
                  💡 {hint}
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Answer buttons */}
        {isTrueFalse ? (
          <div className="font-body mt-5 grid grid-cols-2 gap-5 sm:mt-10 md:mt-20">
            {question.answers.map((answerText, index) => (
              <button
                key={index}
                disabled={isLocked}
                onClick={() => handleSingleSelect(index)}
                className="h-12 rounded-2xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed sm:h-40 sm:py-8 sm:text-xl"
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
                className="text-md w-full max-w-xs items-center justify-center rounded-2xl bg-blue-500 py-2 font-bold text-white transition hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed sm:py-4 sm:text-xl"
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
    </AnimatedBackground>
  );
}
