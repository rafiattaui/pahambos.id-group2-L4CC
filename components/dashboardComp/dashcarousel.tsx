'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import Image from 'next/image';
import { useState } from 'react';
import DashCarItem from './dashcaritem';
import { mockQuizzes, type Quiz } from './quizmockup';
import { X } from 'lucide-react';
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
import { randomizedArray } from './randomized';

export type CategoryTextColor = {
  category: string;
  textColor: string;
};

export default function DashCarousel() {
  const [displayedQuizzes] = useState<Quiz[]>(() =>
    randomizedArray(mockQuizzes).slice(0, 6)
  );
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

  function categoryfilter(category: string) {
    const filtered = mockQuizzes.filter((quiz) => quiz.category === category);
    return filtered;
  }

  return (
    <section className="mt-32">
      <div>
        <span className="font-body-bold ml-2 text-2xl text-white">
          Featured
        </span>
        <div className="relative mx-auto mt-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 rounded-l-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 rounded-r-2xl bg-linear-to-l from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {displayedQuizzes.map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className="w-full text-left"
                      aria-label={'Open quiz ' + quiz.title}
                      title={'Open quiz ' + quiz.title}
                    >
                      <DashCarItem quiz={quiz} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <span className="font-body-bold ml-2 text-2xl text-white">
          Mathematics
        </span>
        <div className="relative mx-auto mt-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 rounded-l-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 rounded-r-2xl bg-linear-to-l from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {categoryfilter('Mathematics').map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className="w-full text-left"
                      aria-label={'Open quiz ' + quiz.title}
                      title={'Open quiz ' + quiz.title}
                    >
                      <DashCarItem quiz={quiz} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <span className="font-body-bold ml-2 text-2xl text-white">
          Technology
        </span>
        <div className="relative mx-auto mt-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 rounded-l-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 rounded-r-2xl bg-linear-to-l from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {categoryfilter('Technology').map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className="w-full text-left"
                      aria-label={'Open quiz ' + quiz.title}
                      title={'Open quiz ' + quiz.title}
                    >
                      <DashCarItem quiz={quiz} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <span className="font-body-bold ml-2 text-2xl text-white">Science</span>
        <div className="relative mx-auto mt-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 rounded-l-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 rounded-r-2xl bg-linear-to-l from-black/70 from-5% to-transparent to-20% md:w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {categoryfilter('Science').map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className="w-full text-left"
                      aria-label={'Open quiz'}
                      title={'Open quiz '}
                    >
                      <DashCarItem quiz={quiz} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

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
    </section>
  );
}
