'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSect() {
  return (
    <div>
      <section className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="font-heading relative text-5xl leading-none font-black sm:text-6xl">
          {/* back/body layer (3D depth) */}
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 -z-10 animate-[shadow-orbit_10s_linear_infinite] text-white blur-xs [text-shadow:-2px_2px_4px_rgba(255,255,255,0.2)]"
          >
            PahamBos.id
          </span>

          {/* front layer (main text) */}
          <span className="text-blue-400">Paham</span>
          <span className="text-orange-400">Bos</span>
          <span className="text-white">.id</span>
        </h1>
        <p className="font-body mt-6 text-center text-lg text-indigo-100">
          The Learning platform for everyone, where you can discover, learn, and
          create with ease. <br />
          Join us today and unlock your full potential!
        </p>
        <div className="mt-10 flex w-full max-w-md flex-row items-center justify-center gap-4">
          <a href="/register" className="w-full max-w-72 sm:w-auto">
            <Button className="w-full max-w-72 cursor-pointer items-center bg-blue-500 px-6 py-6 hover:scale-110 hover:bg-blue-700 active:scale-120 sm:w-72">
              Get Started <ArrowRight />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
