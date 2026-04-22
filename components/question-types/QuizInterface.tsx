'use client';

import { error, time } from 'console';
import { resolve } from 'path';
import { useState, useCallback, useRef, use, useEffect } from 'react';
import { set } from 'zod';

export type QuestionType = 'multiple-choice' | 'true-false' | 'multi-select';

export type QuizQuestion = {
  id: string;
  quizId: string;
  order: number; // 1-based (question 1, question 2, …)
  question: string;
  answers: string[];
  correctAnswer: number;

  type?: QuestionType;
  correctAnswers?: number[];
  timeLimit?: number;
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

// checks for type because type is not explicitly defined in the db
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

  if (type === 'true-false' || type === 'multiple-choice') {
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

const optionStyles = [{ bg: bg - red - 500 }];
