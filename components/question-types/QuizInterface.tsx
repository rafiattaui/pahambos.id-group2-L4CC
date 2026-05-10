'use client';

import { time } from 'console';
import { useState, useEffect } from 'react';

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

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'uuid-1',
    quizId: 'quiz-101',
    order: 1,
    question: 'Which hook is used for side effects in React?',
    answers: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctAnswers: [1],
    timeLimit: 30, // 30 seconds for this question
  },
  {
    id: 'uuid-2',
    quizId: 'quiz-101',
    order: 2,
    question: "What does the 'App Router' use in Next.js?",
    answers: ['Pages directory', 'Server Components', 'Express.js', 'PHP'],
    correctAnswers: [1],
    timeLimit: 15,
  },
  {
    id: 'uuid-3',
    quizId: 'quiz-101',
    order: 3,
    question: '1+1 equals to 2',
    answers: ['True', 'False'],
    correctAnswers: [0],
    timeLimit: 20,
  },
  {
    id: 'uuid-4',
    quizId: 'quiz-101',
    order: 4,
    question: 'Select all prime numbers',
    answers: ['2', '3', '4', '5'],
    correctAnswers: [0, 1, 3], // indices of correct answers for multi select
    type: 'multi-select',
    timeLimit: 25,
  },
];

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

export default function QuizInterface({ questions = MOCK_QUESTIONS }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentData = questions[currentIndex];

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [timeLeft]);

  const progress = (timeLeft / 30) * 100;

  return (
    <div className="relative top-20 left-1/2 h-full w-full max-w-4xl -translate-x-1/2 rounded-2xl border border-white bg-white/40 px-4">
      <div className="mt-6 mb-6 flex flex-col items-center">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-body 0 rounded-full border border-black/20 bg-purple-300 px-4 py-1 text-2xl text-black backdrop-blur-md">
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full border border-black/30 bg-white/30">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="mt-15 mb-10 rounded-4xl border border-white/30 bg-purple-300 p-16 text-black shadow-xl backdrop-blur-md">
        <h2 className="font-heading text-center text-xl">Question 1</h2>
      </div>

      <div className="font-body mb-10 grid grid-cols-2 gap-5">
        {currentData.answers.map((answerText, index) => (
          <button
            key={index}
            className="bg-opacity-80 rounded-2xl px-4 py-8 text-xl font-semibold text-white transition-transform active:scale-95"
            style={{
              backgroundColor: ['#FF3B3B', '#3B82F6', '#00C853', '#FFD600'][
                index
              ],
            }}
          >
            {answerText}
          </button>
        ))}
      </div>
    </div>
  );
}
