// app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Big 404 with brand colors */}
      <h1 className="font-heading text-8xl font-black sm:text-9xl">
        <span className="text-blue-600">4</span>
        <span className="text-orange-500">0</span>
        <span className="text-blue-600">4</span>
      </h1>

      <h2 className="font-heading mt-4 text-2xl font-bold text-slate-800 sm:text-3xl">
        Oops! Page not found
      </h2>

      <p className="font-body mt-3 max-w-md text-slate-500">
        Looks like this page took a wrong turn. Let&apos;s get you back to
        learning!
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard">
          <Button className="font-body w-full bg-blue-600 px-8 py-6 font-bold text-white hover:bg-blue-700 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <Link href="/dashboard/search">
          <Button
            variant="outline"
            className="font-body w-full px-8 py-6 font-bold text-slate-700 sm:w-auto"
          >
            Browse Quizzes
          </Button>
        </Link>
      </div>

      {/* Decorative lightbulb — confused/searching theme */}
      <div className="pointer-events-none mt-12 opacity-30">
        <svg
          viewBox="0 0 180 200"
          className="w-32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M90 28 C114 28 132 48 132 72 C132 90 122 104 112 116 C108 122 106 130 106 140 L74 140 C74 130 72 122 68 116 C58 104 48 90 48 72 C48 48 66 28 90 28 Z"
            stroke="#94A3B8"
            strokeWidth="3"
          />
          <rect
            x="74"
            y="140"
            width="32"
            height="9"
            rx="3"
            stroke="#94A3B8"
            strokeWidth="2.5"
          />
          <rect
            x="76"
            y="149"
            width="28"
            height="9"
            rx="2"
            stroke="#94A3B8"
            strokeWidth="2.5"
          />
          {/* Question mark instead of filament */}
          <text
            x="90"
            y="100"
            textAnchor="middle"
            fontSize="40"
            fontWeight="900"
            fill="#94A3B8"
          >
            ?
          </text>
        </svg>
      </div>
    </div>
  );
}
