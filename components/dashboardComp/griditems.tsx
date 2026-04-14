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
import { Quiz } from './quizmockup';
import Image from 'next/image';
import { CategoryTextColor } from './dashcarousel';
import { X } from 'lucide-react';

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
    <div className="h-full">
      <button
        type="button"
        onClick={() => {
          setSelectedQuiz(quiz);
        }}
        className="block h-full w-full text-left"
      >
        <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl">
          <CardHeader className="relative p-0">
            <Image
              src={'/placeholderquiz.png'}
              alt={quiz.title}
              width={300}
              height={200}
              className="h-48 w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between">
              <span
                className={`font-body text-xs sm:text-sm ${categoriesText.find((c) => c.category === quiz.category)?.textColor || 'text-gray-500'}`}
              >
                {quiz.category}
              </span>
              <span className="font-body text-xs sm:text-sm">
                {quiz.numQuestions} Qs
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <CardTitle className="font-heading line-clamp-2">
              {quiz.title}
            </CardTitle>
            <CardDescription className="font-body mt-2 line-clamp-3">
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
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-transparent p-2 hover:bg-gray-300"
                >
                  <X size={10} color="#000000" />
                </Button>
              </CardAction>
              <Image
                src={'/placeholderquiz.png'}
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
