'use client';

import QuizInterface, {
  QuizQuestion,
  QuizResult,
} from '@/components/question-types/QuizInterface';

const sampleQuestions: QuizQuestion[] = [
  {
    // multiple-choice (default type, can be omitted)
    id: 'q1',
    quizId: 'quiz-abc',
    order: 1,
    question: 'What is the capital of Indonesia?',
    answers: ['Surabaya', 'Bandung', 'Jakarta', 'Bali'],
    correctAnswer: 2, // "Jakarta"
    timeLimit: 20,
  },
  {
    // true-false — auto-detected because answers are ["True","False"]
    id: 'q2',
    quizId: 'quiz-abc',
    order: 2,
    question: 'Next.js is a React framework.',
    answers: ['True', 'False'],
    correctAnswer: 0, // "True"
    timeLimit: 15,
  },
  {
    // multi-select — must set type explicitly; list all correct indices
    id: 'q3',
    quizId: 'quiz-abc',
    order: 3,
    question: 'Which of these are JavaScript frameworks or libraries?',
    answers: ['React', 'Django', 'Vue', 'Laravel'],
    correctAnswer: 0, // primary correct (required by DB schema)
    correctAnswers: [0, 2], // full set: "React" and "Vue"
    type: 'multi-select',
    timeLimit: 25,
  },
  {
    id: 'q4',
    quizId: 'quiz-abc',
    order: 4,
    question: 'What React hook is used for side effects?',
    answers: ['useState', 'useEffect', 'useRef', 'useMemo'],
    correctAnswer: 1, // "useEffect"
    timeLimit: 20,
  },
  {
    id: 'q5',
    quizId: 'quiz-abc',
    order: 5,
    question: 'TypeScript is a superset of JavaScript.',
    answers: ['True', 'False'],
    correctAnswer: 0, // "True"
    timeLimit: 15,
  },
];

function handleQuizComplete(results: QuizResult[]) {
  console.log(results);
}

export default function QuizWrapper() {
  return (
    <QuizInterface
      questions={sampleQuestions}
      onComplete={handleQuizComplete}
    />
  );
}
