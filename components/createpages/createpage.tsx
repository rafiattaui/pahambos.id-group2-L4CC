'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz } from '../dashboardComp/quizmockup';
import GridItems from '../dashboardComp/griditems';
import getQuizzes from '../dashboardComp/quizzes';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardFooter,
} from '../ui/card';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';

type CategoryTextColor = {
  category: string;
  textColor: string;
};

function getCreatorQuizzes() {}

function CreatePageItem({ quiz }: { quiz: Quiz }) {
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
      <Card className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="absolute top-2 right-2 z-10 flex flex-row gap-2">
          <Button variant="outline">
            {' '}
            <Pencil className="h-4 w-4" />{' '}
          </Button>
          <Button variant="outline">
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

export default function CreatePage() {
  const router = useRouter();
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
      <h1 className="font-heading mt-4 text-5xl font-bold text-white">
        Your Quizzes
      </h1>

      <div className="mt-4 grid h-full w-full grid-cols-2 rounded-2xl bg-white sm:grid-cols-3 md:grid-cols-4">
        <Card
          onClick={() => {
            router.push('/create-quiz');
          }}
          className="m-4 cursor-pointer justify-center transition-transform duration-200 hover:scale-105 hover:text-blue-500"
        >
          <CardContent className="flex h-28 items-center justify-center sm:h-40">
            <Plus className="h-20 w-20" />
          </CardContent>
        </Card>
        {mockQuizzes.map((quiz) => (
          <div key={quiz.id} className="m-4">
            <CreatePageItem quiz={quiz} />
          </div>
        ))}
      </div>
    </>
  );
}
