'use client';

import { Button } from '@/components/ui/button';
import { dashboardHref } from './dashboardHref';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChartNoAxesCombined, Flame, NotebookPen } from 'lucide-react';

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

export default function DashboardMain({
  userId,
  userName,
  userAvatar,
}: DashboardMainProps) {
  const router = useRouter();
  const [performance, setPerformance] = useState<PerformanceSummary>(null);

  useEffect(() => {
    fetch(`/api/performance/${userId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPerformance(json.data);
      });
  }, []);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative col-span-1 h-99 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 p-6">
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

        <div className="relative col-span-2 h-99 overflow-hidden rounded-2xl bg-gradient-to-tr from-blue-200 via-blue-400 to-blue-600 p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="flex flex-col items-center justify-center">
            <h2 className="font-body text-2xl font-bold text-white drop-shadow-sm">
              Performance Summary
            </h2>
            <Avatar className="mt-2 h-15 w-15">
              <AvatarImage src={userAvatar} alt={`${userName}'s avatar`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="mt-4 flex w-full flex-wrap justify-center gap-3">
              {[
                {
                  label: 'Final Score',
                  value: performance?.finalScore ?? '—',
                  icon: <Trophy className="h-5 w-5" />,
                },
                {
                  label: 'Accuracy Rate',
                  value: performance?.accuracyRate ?? '—',
                  icon: <ChartNoAxesCombined className="h-5 w-5" />,
                },
                {
                  label: 'Longest Streak',
                  value: performance?.longestStreak ?? '—',
                  icon: <Flame className="h-5 w-5" />,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="w-[calc(50%-100px)] rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm"
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

            <Button className="font-body mt-4 h-11 w-full max-w-xs bg-white font-bold text-blue-600 transition-all hover:scale-105 hover:bg-orange-50">
              View Your Performance
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
