'use client';

import { Button } from '@/components/ui/button';
import { Play, Users, Trophy, Rocket } from 'lucide-react';
import { dashboardHref } from './dashboardHref';
import { useRouter } from 'next/navigation';

const modes = [
  { name: 'Solo Practice', icon: Rocket, color: 'bg-cyan-500' },
  { name: 'Live Quiz', icon: Play, color: 'bg-orange-500' },
  { name: 'Team Mode', icon: Users, color: 'bg-emerald-500' },
  { name: 'Challenge Friend', icon: Trophy, color: 'bg-pink-500' },
];

const greetingMessages = [
  'What do you want to learn for today?',
  'Ready to challenge yourself?',
  'Want to explore new topics?',
  "Booyah! Let's get quizzing!",
  'Time to level up your knowledge!',
];

type DashboardMainProps = {
  userName: string;
};

export default function DashboardMain({ userName }: DashboardMainProps) {
  const router = useRouter();

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-1">
        <div className="from 10% via 50% to 70% relative h-72 overflow-hidden rounded-2xl bg-linear-to-br from-blue-400 via-blue-300 to-blue-100 p-6">
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Hello, {userName}!
          </h1>
          <p className="font-body mt-4 font-bold text-slate-900">
            Let&apos;s learn something new today!
          </p>
          <div className="mt-24 flex flex-wrap justify-start gap-3">
            <Button
              variant="outline"
              onClick={() => {
                router.push(dashboardHref('search'));
              }}
              className="font-body h-12 w-full max-w-md font-bold"
            >
              Browse Quiz
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
