import QuizInterface, {
  QuizQuestion,
} from '@/components/question-types/QuizInterface';

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

export default function QuizPage() {
  return <QuizInterface questions={MOCK_QUESTIONS} />;
}
