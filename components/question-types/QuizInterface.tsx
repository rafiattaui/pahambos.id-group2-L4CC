'use client';

import { error, time } from 'console';
import { resolve } from 'path';
import { useState, useCallback, useRef, use, useEffect } from 'react';
import { set } from 'zod';

export type QuestionType = 'SingleSelect' | 'MultiSelect' | 'TrueFalse';

export interface QuizQuestion {
  id: string;
  quizId: string;
  order: number; // 1-based (question 1, question 2, …)
  question: string;
  answers: string[];
  correctAnswers: number[]; // index of the correct answer in the answers array, multi select included

  // additional fields for type and time limit
  type?: QuestionType;
  timeLimit?: number; // in seconds
}

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

function checkCorrect(q: QuizQuestion, selectedIndices: number[]): boolean {
  const type = resolveType(q);

  if (type === 'SingleSelect' || type === 'TrueFalse') {
    return selectedIndices[0] === q.correctAnswers[0];
  }
  if (type === 'MultiSelect') {
    const correctSet = q.correctAnswers ?? [q.correctAnswers[0]];
    const sorted = [...selectedIndices].sort((a, b) => a - b);
    const sortedCorrect = [...correctSet].sort((a, b) => a - b);
    return (
      sorted.length === sortedCorrect.length &&
      sorted.every((v, i) => v === sortedCorrect[i])
    );
  }
  return false;
}

// Tracking per-question state
interface QuestionResult {
  selectedIndices: number[];
  isCorrect: boolean | null; // null until submitted
  timedOut: boolean;
}

const ANSWER_COLORS = ['#FF3B3B', '#3B82F6', '#5FAD56', '#FFD600'];
const ANSWER_TEXT_COLORS = ['#fff', '#fff', '#fff', '#fff'];

export default function QuizInterface({
  questions,
}: {
  questions: QuizQuestion[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<(QuestionResult | null)[]>(
    Array(questions.length).fill(null)
  );
  const [quizFinished, setQuizFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentQuestion = questions[currentIndex];
  const questionType = resolveType(currentQuestion);
  const totalTime = currentQuestion.timeLimit ?? 30;
  const safeTimeLeft = timeLeft ?? totalTime;

  const [quizStarted, setQuizStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio once
  useEffect(() => {
    bgMusicRef.current = new Audio('/audio/quizmusic.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.2;

    return () => {
      bgMusicRef.current?.pause();
      bgMusicRef.current = null;
    };
  }, []);

  // React to pause/resume separately
  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio || !quizStarted) return;

    if (isPaused) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log('Playback blocked:', err));
    }
  }, [isPaused, quizStarted]);

  function handleStart() {
    bgMusicRef.current
      ?.play()
      .catch((err) => console.log('Playback blocked:', err));
    setCountdown(3);
  }

  // Commit answer and advance to next question
  const commitAndAdvance = useCallback(
    (indices: number[], timedOut = false) => {
      const isCorrect = timedOut
        ? null
        : checkCorrect(currentQuestion, indices);

      setResults((prev) => {
        const next = [...prev];
        next[currentIndex] = { selectedIndices: indices, isCorrect, timedOut };
        return next;
      });
      setIsSubmitted(true);

      // Auto-advance after 1.4 s
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          setSelectedIndices([]);
          setIsSubmitted(false);
          setTimeLeft(questions[currentIndex + 1]?.timeLimit ?? 30);
        } else {
          setQuizFinished(true);
        }
      }, 1400);
    },
    [currentIndex, currentQuestion, questions]
  );

  const commitRef = useRef(commitAndAdvance);
  useEffect(() => {
    commitRef.current = commitAndAdvance;
  }, [commitAndAdvance]);

  // Handle timer
  useEffect(() => {
    if (countdown === null) return;
    const id = setTimeout(() => {
      if (countdown <= 1) {
        // All three updates in one tick — no missing dependency warning
        setQuizStarted(true);
        setCountdown(null);
        setTimeLeft(questions[0]?.timeLimit ?? 30);
      } else {
        setCountdown((c) => (c ?? 1) - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, questions]);

  // Commit answer and advance to next question
  const commitAndAdvance = useCallback(
    (indices: number[], timedOut = false) => {
      const isCorrect = timedOut
        ? null
        : checkCorrect(currentQuestion, indices);

      setResults((prev) => {
        const next = [...prev];
        next[currentIndex] = { selectedIndices: indices, isCorrect, timedOut };
        return next;
      });
      setIsSubmitted(true);

      // Auto-advance after 1.4 s
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          setSelectedIndices([]);
          setIsSubmitted(false);
          setTimeLeft(questions[currentIndex + 1]?.timeLimit ?? 30);
        } else {
          bgMusicRef.current?.pause();
          setQuizFinished(true);
        }
      }, 1400);
    },
    [currentIndex, currentQuestion, questions]
  );

  const commitRef = useRef(commitAndAdvance);
  useEffect(() => {
    commitRef.current = commitAndAdvance;
  }, [commitAndAdvance]);

  // Handle timer
  useEffect(() => {
    if (
      !quizStarted ||
      isSubmitted ||
      quizFinished ||
      isPaused ||
      timeLeft === null
    )
      return;

    if (timeLeft <= 0) {
      commitRef.current([], true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((prev) => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, isSubmitted, quizFinished, isPaused, quizStarted]);

  // Handle answer selection
  function handleSingleSelect(index: number) {
    if (isSubmitted) return;
    setSelectedIndices([index]);
    commitRef.current([index]);
  }

  function handleMultiToggle(index: number) {
    if (isSubmitted) return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleMultiSubmit() {
    if (isSubmitted || selectedIndices.length === 0) return;
    commitRef.current(selectedIndices);
  }

  if (!quizStarted) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-white/30 backdrop-blur-md">
        {countdown !== null ? (
          // Countdown screen
          <div className="flex flex-col items-center gap-4">
            <p className="font-body text-lg text-black/50">Get ready...</p>
            <div
              key={countdown}
              className="animate-bounce text-9xl font-black text-blue-600"
            >
              {countdown}
            </div>
          </div>
        ) : (
          // Splash screen
          <>
            <div className="text-6xl">🎮</div>
            <h1 className="text-4xl font-black text-black">Ready?</h1>
            <p className="text-lg text-black/60">
              {questions.length} questions
            </p>
            <button
              onClick={handleStart}
              className="rounded-2xl bg-blue-500 px-12 py-4 text-2xl font-bold text-white transition hover:bg-blue-600 active:scale-95"
            >
              Start Quiz 🚀
            </button>
          </>
        )}
      </div>
    );
  }

  // Score screen
  if (quizFinished) {
    const correct = results.filter((r) => r?.isCorrect === true).length;
    const timedOut = results.filter((r) => r?.timedOut).length;
    const finalScore = Math.round((correct / questions.length) * 100);

    return (
      <div className="fixed inset-0 h-screen w-screen overflow-y-auto bg-white/30 px-4 pb-10 backdrop-blur-md">
        <div className="mt-10 mb-6 flex flex-col items-center gap-4">
          <div className="text-6xl">
            {finalScore >= 70 ? '🎉' : finalScore >= 40 ? '👍' : '😅'}
          </div>
          <h1 className="font-body text-3xl font-bold text-black">
            Quiz Complete!
          </h1>
          <div className="font-body text-5xl font-black text-blue-600">
            {finalScore}%
          </div>
          <p className="font-body text-lg text-black/70">
            {correct} / {questions.length} correct · {timedOut} timed out
          </p>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedIndices([]);
              setIsSubmitted(false);
              setResults(Array(questions.length).fill(null));
              setQuizFinished(false);
              setTimeLeft(questions[0]?.timeLimit ?? 30);
              setQuizStarted(false);
              setCountdown(3);
              bgMusicRef.current?.play().catch(() => {});
            }}
            className="font-body mx-auto mt-5 w-full max-w-xl items-center rounded-2xl bg-blue-500 py-4 text-xl font-bold text-white transition hover:bg-blue-600 active:scale-95"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="font-body mt-3 mb-10 block w-full max-w-xl rounded-2xl border border-white/50 bg-white/30 py-4 text-center text-xl font-bold text-black transition hover:bg-white/50 active:scale-95"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="font-body mx-auto flex max-w-xl flex-col gap-3">
          <p>Review: </p>
          {questions.map((q, i) => {
            const r = results[i];
            const icon = r?.timedOut ? '⏱️' : r?.isCorrect ? '✅' : '❌';
            return (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-xl border border-white/40 bg-white/50 px-4 py-3"
              >
                <span className="mt-0.5 text-xl">{icon}</span>
                <span className="font-body text-sm leading-snug text-black">
                  {q.question}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const progress = (safeTimeLeft / totalTime) * 100;
  const isCorrectSubmit =
    isSubmitted && checkCorrect(currentQuestion, selectedIndices);

  // Answer button styles
  function getAnswerStyle(index: number) {
    const base = ANSWER_COLORS[index % ANSWER_COLORS.length];
    if (!isSubmitted) {
      const isSelected = selectedIndices.includes(index);
      return {
        backgroundColor: base,
        opacity: 1,
        outline: isSelected ? '4px solid white' : 'none',
        outlineOffset: '2px',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      };
    }

    // After submission, show correct/incorrect
    const isCorrectAnswer = currentQuestion.correctAnswers.includes(index);
    const wasSelected = selectedIndices.includes(index);

    if (isCorrectAnswer) return { backgroundColor: '#00C853', opacity: 1 }; // green for correct
    if (wasSelected && !isCorrectAnswer)
      return { backgroundColor: '#FF3B3B', opacity: 1 }; // red for incorrect
    return { backgroundColor: base, opacity: 0.6 };
  }

  const isTrueFalse = questionType === 'TrueFalse';
  const isMultiSelect = questionType === 'MultiSelect';

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
          <a
            href="/dashboard"
            className="w-full max-w-2xs rounded-2xl border border-white/50 bg-white/20 px-10 py-4 text-center text-xl font-bold text-white transition hover:bg-white/30 active:scale-95"
          >
            Back to Dashboard
          </a>
        </div>
      )}

      {/* Pause button */}
      <button
        onClick={() => setIsPaused((p) => !p)}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/30 text-lg backdrop-blur-sm transition hover:bg-white/50 active:scale-95"
        title="Pause"
      >
        ⏸
      </button>

      {/* Progress bar and timer */}
      <div className="mt-6 mb-6 flex flex-col items-center">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-body rounded-full border border-black/20 bg-blue-300 px-8 py-3 text-2xl text-black backdrop-blur-md">
            00:{safeTimeLeft < 10 ? `0${safeTimeLeft}` : safeTimeLeft}
          </span>
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-black/30 bg-white/30">
        <div
          className="h-full bg-linear-to-r from-yellow-400 to-green-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question counter */}
      <div className="mt-4 flex justify-center">
        <span className="font-body rounded-full border border-black/20 bg-blue-300 px-4 py-1 text-sm text-black">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}

      <div className="mx-auto mt-8 mb-6 w-fit rounded-3xl border border-white/30 bg-blue-300 p-12 text-black shadow-2xl">
        {/* Check for multi select */}
        {isMultiSelect && (
          <p className="mb-2 text-center">
            <span className="font-body rounded-full bg-blue-600 px-4 py-1 text-sm tracking-wider text-white">
              Select all that apply
            </span>
          </p>
        )}
        <h2 className="font-body text-center text-xl leading-tight font-bold">
          {currentQuestion.question}
        </h2>
        {/* Results after submission */}
        {isSubmitted && (
          <p className="text-md font-body mt-6 text-center">
            {selectedIndices.length === 0
              ? "⏱️ Time's up!"
              : isCorrectSubmit
                ? '✅ Correct!'
                : '❌ Wrong!'}
          </p>
        )}
      </div>

      {/* Answer buttons */}
      {isTrueFalse ? (
        // True/False questions
        <div className="font-body mt-20 grid grid-cols-2 gap-5">
          {currentQuestion.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isSubmitted}
              onClick={() => handleSingleSelect(index)}
              className="h-50 rounded-2xl border-black/30 px-4 py-10 text-2xl font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              style={{
                ...getAnswerStyle(index),
                backgroundColor: index === 0 ? '#00C853' : '#FF3B3B',
                ...(isSubmitted ? {} : {}),
              }}
            >
              {index === 0 ? '✓' : '✗'} {answerText}
            </button>
          ))}
        </div>
      ) : isMultiSelect ? (
        // Multi-select questions
        <>
          <div className="font-body mt-20 mb-8 grid grid-cols-4 gap-5">
            {currentQuestion.answers.map((answerText, index) => {
              const isSelected = selectedIndices.includes(index);
              const style = getAnswerStyle(index);
              return (
                <button
                  key={index}
                  disabled={isSubmitted}
                  onClick={() => handleMultiToggle(index)}
                  className="relative h-30 rounded-2xl px-4 py-8 text-xl font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                  style={style}
                >
                  {/* Checkbox indicator */}
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
          <button
            disabled={isSubmitted || selectedIndices.length === 0}
            onClick={handleMultiSubmit}
            className="w-full rounded-2xl bg-blue-600 py-4 text-xl font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitted ? 'Submitted!' : 'Confirm Selection'}
          </button>
        </>
      ) : (
        // Multiple-choice questions
        <div className="font-body mt-20 grid grid-cols-4 gap-5">
          {currentQuestion.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isSubmitted}
              onClick={() => handleSingleSelect(index)}
              className="h-50 rounded-2xl px-4 py-8 text-xl font-semibold shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
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
