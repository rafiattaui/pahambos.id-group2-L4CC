'use client';

import { time } from 'console';
import { resolve } from 'path';
import { useState, useEffect, useCallback, useRef } from 'react';
import { set } from 'zod';

export type QuestionType = 'multiple-choice' | 'multi-select' | 'true-false';

export interface QuizQuestion {
  id: string;
  quizId: string;
  order: number;
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
    return 'true-false';
  }
  return 'multiple-choice';
}

function checkCorrect(q: QuizQuestion, selectedIndices: number[]): boolean {
  const type = resolveType(q);

  if (type === 'multiple-choice' || type === 'true-false') {
    return selectedIndices[0] === q.correctAnswers[0];
  }
  if (type === 'multi-select') {
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

const ANSWER_COLORS = ['#FF3B3B', '#3B82F6', '#00C853', '#FFD600'];
const ANSWER_TEXT_COLORS = ['#fff', '#fff', '#fff', '#fff'];

export default function QuizInterface({
  questions,
}: {
  questions: QuizQuestion[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<(QuestionResult | null)[]>(
    Array(questions.length).fill(null)
  );
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const questionType = resolveType(currentQuestion);
  const totalTime = currentQuestion.timeLimit ?? 30;

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
    if (isSubmitted || quizFinished) return;
    if (timeLeft <= 0) {
      commitRef.current([], true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, isSubmitted, quizFinished]);

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

  // Score screen
  if (quizFinished) {
    const correct = results.filter((r) => r?.isCorrect === true).length;
    const timedOut = results.filter((r) => r?.timedOut).length;
    const finalScore = Math.round((correct / questions.length) * 100);

    return (
      <div className="relative top-20 left-1/2 h-full w-full max-w-4xl -translate-x-1/2 rounded-2xl border border-white bg-white/30 px-4 pb-10 backdrop-blur-md">
        <div className="mt-10 mb-6 flex flex-col items-center gap-4">
          <div className="text-6xl">
            {finalScore >= 70 ? '🎉' : finalScore >= 40 ? '👍' : '😅'}
          </div>
          <h1 className="text-3xl font-bold text-black">Quiz Complete!</h1>
          <div className="text-5xl font-black text-purple-700">
            {finalScore}%
          </div>
          <p className="text-lg text-black/70">
            {correct} / {questions.length} correct · {timedOut} timed out
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const r = results[i];
            const icon = r?.timedOut ? '⏱️' : r?.isCorrect ? '✅' : '❌';
            return (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-xl border border-white/40 bg-white/50 px-4 py-3"
              >
                <span className="mt-0.5 text-xl">{icon}</span>
                <span className="text-sm leading-snug text-black">
                  {q.question}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setSelectedIndices([]);
            setIsSubmitted(false);
            setResults(Array(questions.length).fill(null));
            setQuizFinished(false);
            setTimeLeft(questions[0]?.timeLimit ?? 30);
          }}
          className="mt-8 w-full rounded-2xl bg-purple-500 py-4 text-xl font-bold text-white transition hover:bg-purple-600 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const progress = (timeLeft / totalTime) * 100;
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

  const isTrueFalse = questionType === 'true-false';
  const isMultiSelect = questionType === 'multi-select';

  return (
    <div className="relative top-20 left-1/2 h-full w-full max-w-4xl -translate-x-1/2 rounded-2xl border border-white bg-white/30 px-4 pb-10 backdrop-blur-md">
      {/* Progress bar and timer */}
      <div className="mt-6 mb-6 flex flex-col items-center">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-body rounded-full border border-black/20 bg-purple-300 px-4 py-1 text-black backdrop-blur-md">
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
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
        <span className="font-body rounded-full border border-black/20 bg-purple-300 px-4 py-1 text-sm text-black">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}

      <div className="mt-8 mb-6 rounded-3xl border border-white/30 bg-purple-300 p-10 text-black shadow-xl">
        {/* Check for multi select */}
        {isMultiSelect && (
          <p className="mb-2 text-center">
            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
              Select all that apply
            </span>
          </p>
        )}
        <h2 className="text-center text-xl leading-snug font-bold">
          {currentQuestion.question}
        </h2>
        {/* Results after submission */}
        {isSubmitted && (
          <p className="mt-3 text-center text-sm font-semibold">
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
        <div className="font-body mb-10 grid grid-cols-2 gap-5">
          {currentQuestion.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isSubmitted}
              onClick={() => handleSingleSelect(index)}
              className="rounded-2xl px-4 py-10 text-2xl font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
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
          <div className="font-body mb-5 grid grid-cols-2 gap-5">
            {currentQuestion.answers.map((answerText, index) => {
              const isSelected = selectedIndices.includes(index);
              const style = getAnswerStyle(index);
              return (
                <button
                  key={index}
                  disabled={isSubmitted}
                  onClick={() => handleMultiToggle(index)}
                  className="relative rounded-2xl px-4 py-8 text-xl font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
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
            className="w-full rounded-2xl bg-purple-600 py-4 text-xl font-bold text-white transition hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitted ? 'Submitted!' : 'Confirm Selection'}
          </button>
        </>
      ) : (
        // Multiple-choice questions
        <div className="font-body mb-10 grid grid-cols-2 gap-5">
          {currentQuestion.answers.map((answerText, index) => (
            <button
              key={index}
              disabled={isSubmitted}
              onClick={() => handleSingleSelect(index)}
              className="rounded-2xl px-4 py-8 text-xl font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
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
