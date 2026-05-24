'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz } from '../dashboardComp/quizmockup';
import getQuizzes from '../dashboardComp/quizzes';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import Image from 'next/image';

type CategoryTextColor = {
  category: string;
  textColor: string;
};

function getCreatorQuizzes() {}

function CreatePageItem({ quiz }: { quiz: Quiz }) {
  const router = useRouter();

  const categoriesText: CategoryTextColor[] = [
    { category: 'Mathematics', textColor: 'text-blue-500' },
    { category: 'Science', textColor: 'text-green-500' },
    { category: 'History', textColor: 'text-yellow-500' },
    { category: 'Geography', textColor: 'text-purple-500' },
    { category: 'Literature', textColor: 'text-pink-500' },
    { category: 'Technology', textColor: 'text-cyan-500' },
    { category: 'General', textColor: 'text-gray-500' },
  ];

  return (
    <div className="w-full">
      <Card className="relative flex aspect-4/9 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="absolute top-2 right-2 z-10 flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/create-quiz/${quiz.id}/edit`)}
            aria-label="Edit Quiz"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" aria-label="Delete Quiz">
            {' '}
            <Trash2 className="h-4 w-4" />{' '}
          </Button>
        </div>
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
                className={`font-body text-xs sm:text-sm ${categoriesText.find((c) => c.category === quiz.category)?.textColor || 'text-gray-500'}`}
              >
                {quiz.category}
              </span>
            </div>
            <div className="rounded-md bg-white p-1 sm:p-1.5">
              <span className="font-body text-xs sm:text-sm">
                {quiz.numQuestions} Qs
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-3">
          <CardTitle className="font-heading line-clamp-4 text-sm sm:text-base">
            {quiz.title}
          </CardTitle>
          <div className="hidden md:block">
            <CardDescription className="mt-1 line-clamp-3 text-sm text-gray-500">
              {quiz.description}
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreatePageItemSkeleton() {
  return (
    <div className="w-full">
      <Card className="relative flex aspect-4/9 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="absolute top-2 right-2 z-10 flex flex-row gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
        <CardHeader className="relative p-0">
          <Skeleton className="h-28 w-full rounded-none sm:h-40" />
          <div className="absolute inset-x-1 bottom-3 flex items-center justify-between sm:inset-x-4">
            <Skeleton className="h-6 w-20 rounded-md bg-white/70" />
            <Skeleton className="h-6 w-12 rounded-md bg-white/70" />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-3">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <div className="hidden md:block">
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePage({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [prevCount, setPrevCount] = useState(6);

  const isLoading = quizzes === null;
  const skeletonCount = isLoading ? prevCount : quizzes.length;

  useEffect(() => {
    let cancelled = false;
    getQuizzes({})
      .then((res) => {
        const nextQuizzes = res.data ?? res;
        setQuizzes(nextQuizzes);
        setPrevCount(nextQuizzes.length);
      })
      .catch(() => {
        if (!cancelled) {
          setQuizzes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quiz]);

  const mockQuizzes: Quiz[] = [
    {
      id: 101,
      createdBy: 'Demo Creator',
      title: 'Web Development Fundamentals',
      description:
        'Test your knowledge of HTML, CSS, and JavaScript basics with quick questions.',
      imageUrl: '/placeholderquiz.png',
      numQuestions: 10,
      category: 'Technology',
    },
    {
      id: 102,
      createdBy: 'Demo Creator',
      title: 'World Capitals Quick Quiz',
      description:
        'Identify capitals from around the world in a fast-paced geography challenge.',
      imageUrl: '/placeholderquiz.png',
      numQuestions: 12,
      category: 'Geography',
    },
  ];

  return (
    <>
      <div className="mt-6 rounded-2xl bg-white p-4">
        <div className="w-full justify-center">
          <div className="m-4 mx-auto max-w-[calc(50%-2rem)] sm:max-w-[calc(33.333%-2rem)] md:max-w-[calc(25%-2rem)]">
            <Card
              onClick={() => {
                router.push('/create-quiz');
              }}
              className="relative flex aspect-4/9 cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl transition-colors hover:border-blue-500 hover:text-blue-500 sm:aspect-3/4"
              aria-label="Create New Quiz"
            >
              <CardContent className="flex flex-1 items-center justify-center">
                <Plus className="h-20 w-20" />
              </CardContent>
            </Card>
          </div>
        </div>
        <Separator />

        <h1 className="font-heading m-4 text-5xl font-bold">
          <span className="text-black/90 text-shadow-lg text-shadow-slate-300">
            Your Quizzes
          </span>
        </h1>

        <div className="rounded-2x mt-4 grid h-full w-full grid-cols-2 bg-white sm:grid-cols-3 md:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <Spinner className="h-16 w-16 text-blue-500" />
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="m-4">
                <CreatePageItem quiz={quiz} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
