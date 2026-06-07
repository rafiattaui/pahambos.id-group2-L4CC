'use client';

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
import { X, ChevronRight } from 'lucide-react';
import {
  Card,
  CardTitle,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardAction,
} from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { dashboardHref } from '@/components/dashboardComp/dashboardHref';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CategoryTextColor = {
  category: string;
  textColor: string;
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
    .slice(0, 12); // cap at 12 items in the featured row
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchQuizzesByCategory(category: string): Promise<Quiz[]> {
  const res = await fetch(
    `/api/quiz?tags=${encodeURIComponent(category)}&limit=12`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${category} quizzes`);
  const data = await res.json();
  return (data.data ?? []) as Quiz[];
}

async function fetchAllQuizzes(): Promise<Quiz[]> {
  const res = await fetch('/api/quiz?limit=12', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  const data = await res.json();
  return (data.data ?? []) as Quiz[];
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
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
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
            href={dashboardHref(`search?q=${encodeURIComponent(category)}`)}
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
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {quizzes.map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="aspect-[4/3] basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(quiz)}
                      className="w-full text-left"
                      aria-label={`Open quiz ${quiz.title}`}
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

// ── Main component ────────────────────────────────────────────────────────────

const CATEGORIES = ['Mathematics', 'Technology', 'Science'] as const;

export default function DashCarousel() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

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
    { category: 'Mathematics', textColor: 'text-blue-500' },
    { category: 'Science', textColor: 'text-green-500' },
    { category: 'History', textColor: 'text-yellow-500' },
    { category: 'Geography', textColor: 'text-purple-500' },
    { category: 'Literature', textColor: 'text-pink-500' },
    { category: 'Technology', textColor: 'text-cyan-500' },
    { category: 'General', textColor: 'text-gray-500' },
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
    <section className="mt-32">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedQuiz(null)}
        >
          <Card
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardAction>
                <Button
                  onClick={() => setSelectedQuiz(null)}
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-transparent p-2 hover:bg-gray-300"
                >
                  <X size={10} color="#000000" />
                </Button>
              </CardAction>
              <Image
                src={selectedQuiz.imageUrl || '/placeholderquiz.png'}
                alt={selectedQuiz.title}
                width={400}
                height={200}
                className="mt-4 mb-4 items-center justify-center rounded-2xl"
              />
              <CardTitle className="font-heading">
                {selectedQuiz.title}
              </CardTitle>
              <CardDescription
                className={`font-body ${
                  categoriesText.find(
                    (c) => c.category === selectedQuiz.category
                  )?.textColor || 'text-gray-500'
                }`}
              >
                <span className="font-body text-gray-500">Category:</span>{' '}
                {selectedQuiz.category}
                {selectedQuiz.creatorName && (
                  <CardDescription className="font-body text-gray-400">
                    <span className="text-gray-500">By:</span>{' '}
                    {selectedQuiz.creatorName}
                  </CardDescription>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-body">
                {selectedQuiz.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button className="font-body w-full bg-blue-500 font-bold text-white hover:bg-blue-700 active:translate-y-1">
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </section>
  );
}
