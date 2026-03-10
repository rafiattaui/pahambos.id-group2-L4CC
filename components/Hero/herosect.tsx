'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSect() {
  return (
    <div>
      <section className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="font-heading text-5xl font-black text-white sm:text-6xl">
          PahamBos.id
        </h1>
        <p className="font-body mt-6 text-center text-lg text-indigo-100">
          The Learning platform for everyone, where you can discover, learn, and
          create with ease. <br />
          Join us today and unlock your full potential!
        </p>
        <div className="mt-10 flex flex-row gap-4">
          <a href="/register">
            <Button className="items-center bg-blue-500 px-6 py-6 hover:scale-110 hover:bg-blue-700 active:scale-120">
              Get Started <ArrowRight />
            </Button>
          </a>
          <Button className="bg-white px-6 py-6 text-black hover:scale-110 hover:bg-gray-400">
            Learn More
          </Button>
        </div>
      </section>
    </div>
  );
}
