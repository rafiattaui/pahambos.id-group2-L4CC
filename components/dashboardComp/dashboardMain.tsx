'use client';

import { Button } from '@/components/ui/button';
import { dashboardHref } from './dashboardHref';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

type DashboardMainProps = {
  userName: string;
};

export default function DashboardMain({ userName }: DashboardMainProps) {
  const router = useRouter();

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-1">
        <div className="relative h-72 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 p-6">
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
              <h1 className="font-heading text-3xl font-bold text-white drop-shadow-sm">
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
      </div>
    </section>
  );
}
