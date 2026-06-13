'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import Image from 'next/image';
import { CategoryTextColor } from './dashcarousel';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight, X, Trophy, HelpCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type Quiz = {
  id: string;
  createdBy: string;
  creatorName?: string;
  title: string;
  description: string;
  numQuestions: number;
  imageUrl?: string;
  category:
    | 'Mathematics'
    | 'Science'
    | 'History'
    | 'Geography'
    | 'Technology'
    | 'General'
    | 'Language';
};

// ── Quiz detail types ─────────────────────────────────────────────────────────

type QuestionSummary = {
  id: string;
  question: string;
  type?: string;
};

type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  finalScore: number;
};

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Quiz detail fetch helpers ─────────────────────────────────────────────────

async function fetchQuizQuestions(quizId: string): Promise<QuestionSummary[]> {
  const res = await fetch(`/api/quiz/${quizId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  return (data.quiz?.questions ?? []) as QuestionSummary[];
}

async function fetchLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  const res = await fetch(`/api/leaderboard/${quizId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json();
  console.log('leaderboard data:', data);
  return (data.data ?? data ?? []) as LeaderboardEntry[];
}

// ── Quiz Detail Modal ─────────────────────────────────────────────────────────

type ModalTab = 'details' | 'questions' | 'leaderboard';

function QuizDetailModal({
  quiz,
  categoriesText,
  onClose,
  onStart,
}: {
  quiz: Quiz;
  categoriesText: CategoryTextColor[];
  onClose: () => void;
  onStart: () => void;
}) {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [questionsStatus, setQuestionsStatus] =
    useState<FetchStatus>('loading');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] =
    useState<FetchStatus>('loading');
  const [activeTab, setActiveTab] = useState<ModalTab>('details');

  const categoryStyle = categoriesText.find(
    (c) => c.category === quiz.category
  );
  const medalEmoji = ['🥇', '🥈', '🥉'];
  const medalColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];

  useEffect(() => {
    let cancelled = false;

    fetchQuizQuestions(quiz.id)
      .then((data) => {
        if (!cancelled) {
          setQuestions(data);
          setQuestionsStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setQuestionsStatus('error');
      });

    fetchLeaderboard(quiz.id)
      .then((data) => {
        if (!cancelled) {
          setLeaderboard(data);
          setLeaderboardStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setLeaderboardStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [quiz.id]);

  const DetailsPanel = (
    <div className="flex flex-1 flex-col p-5">
      <h2 className="font-body text-lg font-bold text-slate-800">
        {quiz.title}
      </h2>

      <p className="font-body mt-1 text-sm text-slate-400">
        Created by{' '}
        <span className="font-semibold text-slate-600">
          {quiz.creatorName || 'Anonymous'}
        </span>
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${categoryStyle?.textColor ?? 'text-gray-500'} ${categoryStyle?.bgColor ?? 'bg-gray-100'}`}
        >
          {quiz.category}
        </span>
        <span className="text-xs text-slate-400">•</span>
        <span className="text-xs text-slate-500">
          {quiz.numQuestions} Questions
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
        <div className="mb-1 flex items-center gap-1.5">
          <BookOpen size={12} className="text-slate-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Description
          </span>
        </div>
        <p className="font-body text-sm text-slate-600">
          {quiz.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <Button
          className="font-body w-full bg-blue-600 font-bold hover:bg-blue-700 active:translate-y-0.5"
          onClick={onStart}
        >
          Start Quiz <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const QuestionsPanel = (
    <div className="flex-1 px-5 py-3">
      {questionsStatus === 'loading' && (
        <div className="flex flex-col gap-3 pt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      )}
      {questionsStatus === 'error' && (
        <p className="py-8 text-center text-sm text-red-400">
          Failed to load questions.
        </p>
      )}
      {questionsStatus === 'success' && questions.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          No questions yet.
        </p>
      )}
      {questionsStatus === 'success' && questions.length > 0 && (
        <ol className="flex flex-col gap-2 pb-4">
          {questions.map((q, idx) => (
            <li
              key={q.id}
              className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {idx + 1}
              </span>
              <p className="font-body text-sm text-slate-700">{q.question}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  const LeaderboardPanel = (
    <div className="flex-1 px-4 py-3">
      {leaderboardStatus === 'loading' && (
        <div className="flex flex-col gap-3 pt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      )}
      {leaderboardStatus === 'error' && (
        <p className="py-8 text-center text-sm text-red-400">
          Failed to load leaderboard.
        </p>
      )}
      {leaderboardStatus === 'success' && leaderboard.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <Trophy size={32} className="mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">
            No one has played this quiz yet.
          </p>
        </div>
      )}
      {leaderboardStatus === 'success' && leaderboard.length > 0 && (
        <ol className="flex flex-col gap-2 pb-4">
          {leaderboard.map((entry) => (
            <li
              key={entry.userId}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                entry.rank === 1
                  ? 'bg-yellow-50 ring-1 ring-yellow-200'
                  : 'bg-slate-50'
              }`}
            >
              <span
                className={`w-5 text-center text-sm font-bold ${
                  entry.rank <= 3
                    ? medalColors[entry.rank - 1]
                    : 'text-slate-400'
                }`}
              >
                {entry.rank <= 3 ? medalEmoji[entry.rank - 1] : entry.rank}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-body truncate text-sm font-semibold text-slate-700">
                  {entry.userName}
                </span>
              </div>
              <span className="font-body text-sm font-bold text-blue-600">
                {entry.finalScore.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white text-black shadow-2xl md:h-[90vh] md:max-w-5xl md:flex-row md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
          aria-label="Close"
        >
          <X size={14} color="#475569" />
        </button>

        {/* ── MOBILE LAYOUT ── */}
        <div className="flex h-full flex-col overflow-hidden md:hidden">
          {/* Cover image */}
          <div className="relative h-40 w-full shrink-0 bg-slate-100">
            <Image
              src={quiz.imageUrl || '/placeholderquiz.png'}
              alt={quiz.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-slate-100">
            {(
              [
                {
                  id: 'details',
                  label: 'Details',
                  icon: <BookOpen size={14} />,
                },
                {
                  id: 'questions',
                  label: 'Questions',
                  icon: <HelpCircle size={14} />,
                },
                {
                  id: 'leaderboard',
                  label: 'Leaderboard',
                  icon: <Trophy size={14} />,
                },
              ] as { id: ModalTab; label: string; icon: React.ReactNode }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-slate-400'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'details' && DetailsPanel}
            {activeTab === 'questions' && QuestionsPanel}
            {activeTab === 'leaderboard' && LeaderboardPanel}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}

        {/* Panel 1: Image + Details */}
        <div className="hidden w-[320px] min-w-[320px] flex-col overflow-y-auto border-r border-slate-100 md:flex">
          <div className="relative h-48 w-full shrink-0 bg-slate-100">
            <Image
              src={quiz.imageUrl || '/placeholderquiz.png'}
              alt={quiz.title}
              fill
              className="object-cover"
            />
          </div>
          {DetailsPanel}
        </div>

        {/* Panel 2: Questions */}
        <div className="hidden flex-1 flex-col overflow-y-auto border-r border-slate-100 md:flex">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-blue-500" />
              <h3 className="font-body text-sm font-bold text-slate-700">
                Questions
              </h3>
              {questionsStatus === 'success' && (
                <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                  {questions.length}
                </span>
              )}
            </div>
          </div>
          {QuestionsPanel}
        </div>

        {/* Panel 3: Leaderboard */}
        <div className="hidden w-[260px] min-w-[260px] flex-col overflow-y-auto md:flex">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              <h3 className="font-body text-sm font-bold text-slate-700">
                Leaderboard
              </h3>
            </div>
          </div>
          {LeaderboardPanel}
        </div>
      </div>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="w-full">
      <div className="relative flex aspect-6/7 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="relative p-0">
          <Skeleton className="h-28 w-full rounded-none sm:h-40" />
          <div className="absolute inset-x-1 bottom-3 flex items-center justify-between sm:inset-x-4">
            <Skeleton className="h-6 w-16 rounded-md bg-white/60" />
            <Skeleton className="h-6 w-12 rounded-md bg-white/60" />
          </div>
        </div>
        <div className="px-2 sm:p-3">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-2 hidden md:block">
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GridItems({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const categoriesText: CategoryTextColor[] = [
    {
      category: 'Mathematics',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      category: 'Science',
      textColor: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      category: 'History',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      category: 'Geography',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      category: 'Language',
      textColor: 'text-pink-500',
      bgColor: 'bg-pink-100',
    },
    {
      category: 'Technology',
      textColor: 'text-cyan-500',
      bgColor: 'bg-cyan-100',
    },
    { category: 'General', textColor: 'text-gray-500', bgColor: 'bg-gray-100' },
  ];

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          setSelectedQuiz(quiz);
        }}
        className="block h-full w-full cursor-pointer rounded-2xl border border-slate-100 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      >
        <Card className="relative flex aspect-6/7 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
          <CardHeader className="relative p-0">
            <Image
              src={quiz.imageUrl || '/placeholderquiz.png'}
              alt={quiz.title}
              width={300}
              height={200}
              className="h-28 w-full object-cover sm:h-40"
            />
            <div className="absolute inset-x-1 bottom-3 flex items-center justify-between sm:inset-x-4">
              <div className="rounded-md bg-white p-1 sm:p-1.5">
                <span
                  className={`font-body rounded-md p-1 text-xs font-bold sm:text-sm ${categoriesText.find((c) => c.category === quiz.category)?.textColor} ${categoriesText.find((c) => c.category === quiz.category)?.bgColor || 'bg-gray-100'}`}
                >
                  {quiz.category}
                </span>
              </div>
              <div className="rounded-md bg-white p-1 sm:p-1.5">
                <span className="font-body text-xs font-bold text-slate-700 sm:text-sm">
                  {quiz.numQuestions} Qs
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-3">
            <CardTitle className="font-body line-clamp-4 text-sm font-bold text-slate-800 sm:text-base">
              {quiz.title}
            </CardTitle>
            <CardDescription className="font-body mt-1 line-clamp-3 text-sm text-slate-400">
              {quiz.description}
            </CardDescription>
          </CardContent>
        </Card>
      </button>

      {selectedQuiz && (
        <QuizDetailModal
          quiz={selectedQuiz}
          categoriesText={categoriesText}
          onClose={() => setSelectedQuiz(null)}
          onStart={() => router.push(`/play/${selectedQuiz.id}`)}
        />
      )}
    </div>
  );
}
