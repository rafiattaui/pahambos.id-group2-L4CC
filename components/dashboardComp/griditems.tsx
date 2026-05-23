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
import { X } from 'lucide-react';

export type Quiz = {
  id: number;
  createdBy: string;
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
    | 'General';
};

export function QuizSkeleton() {
  return (
    <div className="w-full">
      <div className="relative flex aspect-7/9 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
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
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

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
      <button
        type="button"
        onClick={() => {
          setSelectedQuiz(quiz);
        }}
        className="block h-full w-full text-left"
      >
        <Card className="relative flex aspect-7/9 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
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
              <CardTitle>{selectedQuiz.title}</CardTitle>
              <CardDescription
                className={`categoriesText ${categoriesText.find((c) => c.category === selectedQuiz.category)?.textColor || 'text-gray-500'}`}
              >
                <span className="text-gray-500">Category:</span>{' '}
                {selectedQuiz.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDescription>{selectedQuiz.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-700 active:translate-y-1">
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
