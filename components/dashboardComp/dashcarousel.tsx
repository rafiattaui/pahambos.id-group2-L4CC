'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import DashCarItem from './dashcaritem';
import { type Quiz } from './quizmockup';
import {
  X,
  ChevronRight,
  ArrowRight,
  Trophy,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { dashboardHref } from '@/components/dashboardComp/dashboardHref';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CategoryTextColor = {
  category: string;
  textColor: string;
  bgColor?: string;
};

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Featured algorithm ────────────────────────────────────────────────────────
// Sorted by newest first (createdAt DESC).
// When you have play counts / ratings, replace with:
//   score = plays * 0.6 + avgRating * 0.4
function getFeatured(quizzes: Quiz[]): Quiz[] {
  return [...quizzes]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    )
    .slice(0, 6); // cap at 6 items in the featured row
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchQuizzesByCategory(category: string): Promise<Quiz[]> {
  const res = await fetch(
    `/api/quiz?tags=${encodeURIComponent(category)}&limit=6`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${category} quizzes`);
  const data = await res.json();
  return (data.data ?? []) as Quiz[];
}

async function fetchAllQuizzes(): Promise<Quiz[]> {
  const res = await fetch('/api/quiz?limit=6', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  const data = await res.json();
  return (data.data ?? []) as Quiz[];
}

// ── Quiz detail types ──────────────────────────────────────────────────────────

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
  return (data.data ?? data ?? []) as LeaderboardEntry[];
}

// ── Skeleton carousel ─────────────────────────────────────────────────────────

function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="min-w-[calc(50%-1rem)] md:min-w-[calc(33%-1rem)] lg:min-w-[calc(25%-1rem)]"
        >
          <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

// ── Section component (avoids repeating carousel JSX) ────────────────────────

function CarouselSection({
  title,
  category,
  quizzes,
  status,
  onSelect,
}: {
  title: string;
  category?: string; // omit for Featured (no "See More" link)
  quizzes: Quiz[];
  status: FetchStatus;
  onSelect: (quiz: Quiz) => void;
}) {
  return (
    <div className="mt-20">
      <div className="flex flex-row justify-between">
        <span className="font-body ml-2 text-2xl font-bold text-slate-800">
          {title}
        </span>
        {category && (
          <Link
            href={dashboardHref(`search?tags=${encodeURIComponent(category)}`)}
            className="ml-2"
          >
            <span className="font-body flex cursor-pointer flex-wrap text-blue-600 hover:underline active:text-blue-800">
              See More <ChevronRight />
            </span>
          </Link>
        )}
      </div>

      <div className="relative mx-auto mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 rounded-l-2xl bg-linear-to-r from-blue-100/95 from-5% to-transparent to-20% md:w-xs" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 rounded-r-2xl bg-linear-to-l from-blue-100/95 from-5% to-transparent to-20% md:w-xs" />
        <div className="relative z-10">
          {status === 'loading' && <CarouselSkeleton />}

          {status === 'error' && (
            <p className="py-8 text-center text-sm text-red-400">
              Failed to load quizzes.
            </p>
          )}

          {status === 'success' && quizzes.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              No quizzes here yet.
            </p>
          )}

          {status === 'success' && quizzes.length > 0 && (
            <Carousel opts={{ align: 'center' }}>
              <CarouselContent>
                {quizzes.map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="aspect-[3/2] basis-1/1 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(quiz)}
                      className="w-full text-left"
                      title={`Open quiz ${quiz.title}`}
                    >
                      <DashCarItem quiz={quiz} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </div>
    </div>
  );
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

  // ── Shared panel content (reused by both mobile tabs and desktop panels) ──

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
                {entry.rank <= 3
                  ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                  : entry.rank}
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
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
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

// ── Main component ────────────────────────────────────────────────────────────

const CATEGORIES = ['Mathematics', 'Technology', 'Science'] as const;

export default function DashCarousel() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const router = useRouter();

  // One status + data pair per section
  const [featured, setFeatured] = useState<Quiz[]>([]);
  const [featuredStatus, setFeaturedStatus] = useState<FetchStatus>('idle');

  const [categoryQuizzes, setCategoryQuizzes] = useState<
    Record<string, Quiz[]>
  >({});
  const [categoryStatus, setCategoryStatus] = useState<
    Record<string, FetchStatus>
  >({});

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

  // Fetch featured (all quizzes, sorted by newest)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFeaturedStatus('loading');
      const all = await fetchAllQuizzes();
      if (cancelled) return;
      setFeatured(getFeatured(all));
      setFeaturedStatus('success');
    }

    load().catch(() => {
      if (!cancelled) setFeaturedStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch each category independently so they load in parallel
  // without blocking each other
  useEffect(() => {
    const controllers: AbortController[] = [];

    CATEGORIES.forEach((category) => {
      const controller = new AbortController();
      controllers.push(controller);

      setCategoryStatus((prev) => ({ ...prev, [category]: 'loading' }));

      fetchQuizzesByCategory(category)
        .then((quizzes) => {
          if (controller.signal.aborted) return;
          setCategoryQuizzes((prev) => ({ ...prev, [category]: quizzes }));
          setCategoryStatus((prev) => ({ ...prev, [category]: 'success' }));
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setCategoryStatus((prev) => ({ ...prev, [category]: 'error' }));
        });
    });

    return () => controllers.forEach((c) => c.abort());
  }, []);

  return (
    <section className="mt-20">
      {/* Featured */}
      <div>
        <CarouselSection
          title="Featured"
          quizzes={featured}
          status={featuredStatus}
          onSelect={setSelectedQuiz}
        />
      </div>

      {/* Category sections */}
      {CATEGORIES.map((category) => (
        <CarouselSection
          key={category}
          title={category}
          category={category}
          quizzes={categoryQuizzes[category] ?? []}
          status={categoryStatus[category] ?? 'idle'}
          onSelect={setSelectedQuiz}
        />
      ))}

      {/* Quiz detail modal */}
      {selectedQuiz && (
        <QuizDetailModal
          quiz={selectedQuiz}
          categoriesText={categoriesText}
          onClose={() => setSelectedQuiz(null)}
          onStart={() => router.push(`play/${selectedQuiz.id}`)}
        />
      )}
    </section>
  );
}
