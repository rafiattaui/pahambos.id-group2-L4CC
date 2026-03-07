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
    <div className="container my-16 border-2">
      <section className="">
        <h2 className="font-heading text-4xl font-bold text-white">Discover</h2>
        <p className="mt-6 mb-6 text-white">
          Explore many quizzes based on your preferred categories
        </p>
        <Carousel
          opts={{ loop: true, align: 'center' }}
          setApi={setApi}
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
          className="mx-auto w-full max-w-100 sm:max-w-350"
        >
          <CarouselContent className="">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="sm:basis-1/3">
                <div className="">
                  <Card>
                    <CardContent className="flex items-center justify-center p-6 md:h-48">
                      <span className="text-4xl font-semibold">
                        {index + 1}
                      </span>
                    </CardContent>
                  </Card>
                </div>
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
