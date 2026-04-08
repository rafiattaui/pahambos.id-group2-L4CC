'use client';

import {
  Carousel,
  CarouselContent,
  CarouselApi,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import DashCarItem from './dashcaritem';
import { mockQuizzes, Quiz } from './quizmockup';

export default function DashCarousel() {
  return (
    <section className="mt-32">
      <div>
        <span className="font-body-bold ml-2 text-2xl text-white">
          Featured
        </span>
        <div className="relative mx-auto mt-4">
          <div className="absolute inset-0 z-20 max-w-20 rounded-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:max-w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {mockQuizzes.map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <DashCarItem quiz={quiz} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

      <div className="mt-32">
        <span className="font-body-bold ml-2 text-2xl text-white">Weekly</span>
        <div className="relative mx-auto mt-4">
          <div className="absolute inset-0 z-20 max-w-20 rounded-2xl bg-linear-to-r from-black/70 from-5% to-transparent to-20% md:max-w-xs" />
          <div className="relative z-10">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {mockQuizzes.map((quiz) => (
                  <CarouselItem
                    key={quiz.id}
                    className="basis-1/2 p-4 md:basis-1/3 lg:basis-1/4"
                  >
                    <DashCarItem quiz={quiz} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
