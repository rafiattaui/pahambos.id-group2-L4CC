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
    <div id="discover" className="my-16">
      <section className="container mx-auto w-full">
        <h2 className="font-heading ml-4 text-4xl font-bold text-white">
          Discover
        </h2>
        <p className="mt-6 mb-6 ml-4 text-white">
          Explore many quizzes based on your preferred categories
        </p>
        <Carousel
          opts={{ loop: true, align: 'start' }}
          setApi={setApi}
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
          className="mx-auto w-full max-w-96 md:max-w-7xl"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="basis-full sm:basis-1/3">
                <Card>
                  <CardContent className="flex h-40 items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
    </div>
  );
}
