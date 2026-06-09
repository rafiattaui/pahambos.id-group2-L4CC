'use client';

import { Quiz } from './quizmockup';
import Image from 'next/image';

export default function DashCarItem({ quiz }: { quiz: Quiz }) {
  return (
    <div className="group relative h-36 w-full overflow-hidden rounded-2xl md:h-40">
      <Image
        className="h-full w-full rounded-2xl object-cover"
        src={quiz.imageUrl || '/placeholder.png'}
        alt={quiz.title}
        width={400}
        height={200}
      ></Image>
      <div className="pointer-events-none absolute inset-0 bg-black/33 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="pointer-events-none absolute top-4 left-4 z-10 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <h3 className="font-body text-lg font-bold">{quiz.title}</h3>
        <p className="font-body text-sm text-white/80">
          Category: {quiz.category}
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="font-body text-sm text-white/80">
          Created by {quiz.creatorName || 'Anonymous'}
        </p>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 z-10 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="font-body text-sm text-white/80">
          {quiz.numQuestions} Questions
        </p>
      </div>
    </div>
  );
}
