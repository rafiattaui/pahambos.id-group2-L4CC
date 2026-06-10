'use client';

import { Quiz } from './quizmockup';
import Image from 'next/image';

export default function DashCarItem({ quiz }: { quiz: Quiz }) {
  return (
    <div className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Fixed height image area — always consistent */}
      <div className="relative h-40 w-full overflow-hidden bg-blue-50">
        <Image
          src={quiz.imageUrl || '/placeholderquiz.png'}
          alt={quiz.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Question count — top right */}
        <div className="absolute bottom-2 left-2">
          <span className="font-body rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {quiz.numQuestions} Qs
          </span>
        </div>
      </div>

      {/* Card text content */}
      <div className="p-3">
        <p className="font-body line-clamp-1 text-sm font-bold text-slate-800">
          {quiz.title}
        </p>
        <p className="font-body mt-0.5 text-xs text-slate-400">
          by {quiz.creatorName || 'Anonymous'}
        </p>
      </div>
    </div>
  );
}
