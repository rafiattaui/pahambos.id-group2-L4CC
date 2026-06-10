'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from '../ui/card';
import Image from 'next/image';
import { CategoryTextColor } from './dashcarousel';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight, X } from 'lucide-react';
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
            <CardTitle className="font-body line-clamp-4 text-sm font-bold wrap-anywhere text-slate-800 sm:text-base">
              {quiz.title}
            </CardTitle>
            <CardDescription className="font-body mt-1 line-clamp-3 text-sm text-slate-400">
              {quiz.description}
            </CardDescription>
          </CardContent>
        </Card>
      </button>

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
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-transparent p-1 transition-colors hover:bg-slate-100"
                >
                  <X size={10} color="#000000" />
                </Button>
              </CardAction>
              <div className="relative h-48 w-full overflow-hidden rounded-2xl">
                <Image
                  src={selectedQuiz.imageUrl || '/placeholderquiz.png'}
                  alt={selectedQuiz.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardTitle className="font-body font-bold wrap-anywhere">
                {selectedQuiz.title}
              </CardTitle>
              <CardDescription className="font-body flex flex-col">
                <p className="text-slate-400">
                  Created by
                  <span className="mb-2 font-semibold text-slate-600">
                    : {selectedQuiz.creatorName || 'Anonymous'}
                  </span>
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold ${categoriesText.find((c) => c.category === quiz.category)?.textColor} ${categoriesText.find((c) => c.category === quiz.category)?.bgColor || 'bg-gray-100'}`}
                  >
                    {selectedQuiz.category}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    {selectedQuiz.numQuestions} Questions
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-body">
                <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    {selectedQuiz.description}
                  </p>
                </div>
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                className="font-body w-full bg-blue-600 font-bold hover:bg-blue-700 active:translate-y-1"
                onClick={() => {
                  router.push(`/play/${selectedQuiz.id}`);
                }}
              >
                Start Quiz <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
