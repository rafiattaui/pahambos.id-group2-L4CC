'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { Card, CardContent } from '../ui/card';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useState } from 'react';

export default function Discover() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="my-16">
      <section id="discover" className="container mx-auto flex w-full flex-col">
        <h2 className="font-heading ml-4 text-4xl font-bold text-white">
          Discover Quizzes <br /> Up to {count}{' '}
          <br className="inline sm:hidden" />
          categories!
        </h2>
        <p className="mt-6 mb-6 ml-4 text-white">
          Explore many quizzes based on your preferred categories
        </p>
        <div className="sm:px-16">
          <Carousel
            opts={{ loop: true, align: 'start' }}
            setApi={setApi}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
            className="mx-auto w-full max-w-72 md:max-w-7xl"
          >
            <CarouselContent className="md:-ml-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem
                  key={index}
                  className="basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card>
                    <CardContent className="flex h-40 items-center justify-center p-6">
                      <span className="text-4xl font-semibold">
                        {index + 1}
                      </span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </section>
    </div>
  );
}
