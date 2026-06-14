'use client';

import { Button } from '@/components/ui/button';
import { dashboardHref } from './dashboardHref';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChartNoAxesCombined, Flame, NotebookPen } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type PerformanceSummary = {
  totalQuizzes: number;
  finalScore: number;
  accuracyRate: string;
  longestStreak: number;
} | null;

type DashboardMainProps = {
  userId: string;
  userName: string;
  userAvatar?: string;
  performance?: PerformanceSummary;
};

export function usePerformance(userId: string) {
  const [performance, setPerformance] = useState<PerformanceSummary>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/performance`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPerformance(json.data);
        else setError(json.error);
      })
      .catch(() => setError('Failed to fetch performance'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { performance, loading, error };
}

export default function DashboardMain({
  userId,
  userName,
  userAvatar,
}: DashboardMainProps) {
  const router = useRouter();
  const { performance, loading } = usePerformance(userId);
  const userAvatarImage = userAvatar ?? '/avatar_placeholder.jpg';

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative col-span-2 h-99 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 p-6 md:col-span-1">
          {/* Dot pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Decorative circle blobs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-16 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-40 bottom-10 h-16 w-16 rounded-full bg-orange-400/30" />

          {/* Notebook + Pen — bottom right */}
          <div className="pointer-events-none absolute top-30 left-20 opacity-20">
            <svg
              viewBox="0 0 160 180"
              className="w-36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              transform="rotate(-10 80 90)"
            >
              {/* Clipboard body */}
              <rect
                x="10"
                y="20"
                width="100"
                height="130"
                rx="8"
                stroke="white"
                strokeWidth="3.5"
              />
              {/* Clipboard top clip */}
              <rect
                x="38"
                y="12"
                width="44"
                height="18"
                rx="6"
                stroke="white"
                strokeWidth="3"
              />
              <circle cx="60" cy="21" r="4" stroke="white" strokeWidth="2.5" />
              {/* Check rows */}
              <rect
                x="22"
                y="50"
                width="10"
                height="10"
                rx="2"
                stroke="white"
                strokeWidth="2.5"
              />
              <path
                d="M24 55 L27 58 L31 52"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="40"
                y1="55"
                x2="96"
                y2="55"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <rect
                x="22"
                y="72"
                width="10"
                height="10"
                rx="2"
                stroke="white"
                strokeWidth="2.5"
              />
              <path
                d="M24 77 L27 80 L31 74"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="40"
                y1="77"
                x2="96"
                y2="77"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <rect
                x="22"
                y="94"
                width="10"
                height="10"
                rx="2"
                stroke="white"
                strokeWidth="2.5"
              />
              <line
                x1="40"
                y1="99"
                x2="96"
                y2="99"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <line
                x1="22"
                y1="121"
                x2="80"
                y2="121"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Pen — tip bottom-left, eraser top-right, writing angle */}
              <g transform="rotate(35 80 120)">
                {/* Pen body */}
                <rect
                  x="68"
                  y="60"
                  width="16"
                  height="75"
                  rx="3"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Eraser top */}
                <rect
                  x="68"
                  y="60"
                  width="16"
                  height="12"
                  rx="3"
                  stroke="white"
                  strokeWidth="2.5"
                />
                {/* Tip */}
                <path
                  d="M68 135 L84 135 L76 155 Z"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Graphite point */}
                <line
                  x1="76"
                  y1="150"
                  x2="76"
                  y2="155"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Clip on pen */}
                <line
                  x1="84"
                  y1="65"
                  x2="84"
                  y2="110"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>
            </svg>
          </div>

          {/* Content */}
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <h1 className="font-body text-3xl font-bold text-white drop-shadow-sm">
                Hello, {userName}! 👋
              </h1>
              <p className="font-body mt-2 text-base text-white/80">
                What do you want to learn for today?
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push(dashboardHref('search'))}
                className="font-body h-11 w-full max-w-xs bg-white font-bold text-blue-600 transition-all hover:scale-105 hover:bg-orange-50"
              >
                Browse Quiz
              </Button>
            </div>
          </div>
        </div>

        <div className="relative col-span-2 h-108 overflow-hidden rounded-2xl bg-gradient-to-tr from-blue-200 via-blue-400 to-blue-600 p-6 sm:h-99">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Trophy — bottom left */}
          <div className="pointer-events-none absolute top-2 -left-2 opacity-20">
            <svg
              viewBox="0 0 160 180"
              className="w-36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Trophy cup */}
              <path
                d="M50 20 L110 20 L104 70 C102 90 80 100 80 100 C80 100 58 90 56 70 Z"
                stroke="white"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Handles */}
              <path
                d="M50 25 Q28 25 28 50 Q28 70 50 72"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M110 25 Q132 25 132 50 Q132 70 110 72"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Stem */}
              <line
                x1="80"
                y1="100"
                x2="80"
                y2="128"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Base plate */}
              <rect
                x="56"
                y="128"
                width="48"
                height="10"
                rx="4"
                stroke="white"
                strokeWidth="3"
              />
              <rect
                x="48"
                y="138"
                width="64"
                height="10"
                rx="4"
                stroke="white"
                strokeWidth="3"
              />
              {/* Star inside cup */}
              <path
                d="M80 38 L83 48 L93 48 L85 54 L88 64 L80 58 L72 64 L75 54 L67 48 L77 48 Z"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Stars burst — top right */}
          <div className="pointer-events-none absolute right-2 bottom-2 opacity-20">
            <svg
              viewBox="0 0 140 140"
              className="w-32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Big star */}
              <path
                d="M70 15 L76 50 L110 50 L83 70 L93 105 L70 85 L47 105 L57 70 L30 50 L64 50 Z"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Small star top-right */}
              <path
                d="M115 18 L117 25 L124 25 L119 29 L121 36 L115 32 L109 36 L111 29 L106 25 L113 25 Z"
                stroke="white"
                strokeWidth="2"
              />
              {/* Tiny star bottom-right */}
              <path
                d="M125 75 L126 79 L130 79 L127 81 L128 85 L125 83 L122 85 L123 81 L120 79 L124 79 Z"
                stroke="white"
                strokeWidth="1.8"
              />
              {/* Sparkle lines */}
              <line
                x1="105"
                y1="55"
                x2="112"
                y2="55"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="108"
                y1="48"
                x2="108"
                y2="62"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 100 full mark — top right, rough handwritten style */}
          <div className="pointer-events-none absolute -top-1 right-2 opacity-20">
            <svg
              viewBox="0 0 180 100"
              className="w-44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rough underline scribble */}
              <path
                d="M8 85 Q50 92 95 86 Q130 80 168 88"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M20 90 Q70 96 110 91 Q145 86 165 93"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />

              {/* "1" — slightly tilted, rough */}
              <path
                d="M10 28 L18 18 L18 65"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 65 L26 65"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* First "0" — wobbly circle */}
              <path
                d="M52 18 Q72 14 76 32 Q80 50 72 62 Q62 74 48 68 Q34 62 36 44 Q38 26 52 18 Z"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Second "0" — wobbly circle, slightly different shape */}
              <path
                d="M108 20 Q128 15 133 34 Q137 53 128 64 Q117 76 103 69 Q89 62 91 43 Q93 24 108 20 Z"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Circle/star accent around the 100 */}
              <path
                d="M155 15 L157 22 L164 22 L158 26 L161 33 L155 29 L149 33 L151 26 L145 22 L152 22 Z"
                stroke="white"
                strokeWidth="1.8"
              />

              {/* Small circle accent bottom left */}
              <circle cx="8" cy="72" r="3" stroke="white" strokeWidth="1.8" />
            </svg>
          </div>

          {/* Checkmark + circle — bottom left, like a graded paper mark */}
          <div className="pointer-events-none absolute bottom-16 left-4 opacity-15">
            <svg
              viewBox="0 0 80 80"
              className="w-16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rough circle */}
              <path
                d="M40 8 Q62 6 70 24 Q78 42 68 58 Q56 74 38 72 Q20 70 12 54 Q4 38 14 22 Q24 6 40 8 Z"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Big checkmark inside */}
              <path
                d="M22 40 L34 54 L58 26"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Pencil scribble lines — like underlining a grade */}
          <div className="pointer-events-none absolute right-0 bottom-6 left-0 px-6 opacity-10">
            <svg
              viewBox="0 0 400 30"
              className="w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 10 Q100 6 200 10 Q300 14 400 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0 20 Q80 16 180 20 Q280 24 400 18"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h2 className="font-body text-2xl font-bold text-white drop-shadow-sm">
              Performance Summary
            </h2>
            <Avatar className="mt-2 h-15 w-15">
              <AvatarImage src={userAvatarImage} alt={`${userName}'s avatar`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              {loading ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm"
                    >
                      <Skeleton className="mb-2 h-3 w-20 bg-white/30" />
                      <Skeleton className="h-6 w-12 bg-white/40" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 justify-center gap-3">
                  {[
                    {
                      label: 'Highest Score',
                      value: performance?.finalScore ?? '—',
                      icon: <Trophy className="h-5 w-5" />,
                    },
                    {
                      label: 'Average Accuracy',
                      value: performance?.accuracyRate ?? '—',
                      icon: <ChartNoAxesCombined className="h-5 w-5" />,
                    },
                    {
                      label: 'Longest Streak',
                      value: performance?.longestStreak ?? '—',
                      icon: <Flame className="h-5 w-5" />,
                    },
                    {
                      label: 'Quiz Attempts',
                      value: performance?.totalQuizzes ?? '—',
                      icon: <NotebookPen className="h-5 w-5" />,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm"
                    >
                      <p className="font-body text-xs text-white/70">
                        {stat.icon} {stat.label}
                      </p>
                      <p className="font-heading text-xl font-black text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="font-body mt-4 h-11 w-full max-w-xs bg-white font-bold text-blue-600 transition-all hover:scale-105 hover:bg-orange-50">
              View Your Performance
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
