'use client';

import {
  Trophy,
  Flame,
  Target,
  BookOpen,
  Users,
  Crown,
  Play,
  Star,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type UserRole = 'Learner' | 'Educator';

const role: UserRole = 'Learner';

const weeklyScores = [58, 66, 72, 74, 80, 84, 91];
const missions = [
  { title: 'Complete 1 Science quiz', done: true },
  { title: 'Play Memory Challenge', done: false },
  { title: 'Reach 85% accuracy today', done: false },
];

const recommendations = [
  { title: 'Fractions Sprint', category: 'Mathematics', questions: 12 },
  { title: 'Planet Explorer', category: 'Science', questions: 10 },
  { title: 'History Blitz', category: 'History', questions: 15 },
];

const leaderboard = [
  { name: 'Alya', xp: 2450 },
  { name: 'You', xp: 2310 },
  { name: 'Bima', xp: 2275 },
];

export default function DashboardMain() {
  const maxScore = Math.max(...weeklyScores);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-teal-50 via-cyan-50 to-amber-50 p-6">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-teal-200/40 blur-2xl" />
        <div className="absolute -bottom-10 left-1/2 h-40 w-40 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Learning HQ</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Welcome back, Rafi
            </h1>
            <p className="mt-1 text-slate-700">
              You are on a 7 day streak. Keep the momentum going.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">Level</p>
              <p className="text-lg font-bold text-slate-900">14</p>
            </div>
            <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500">XP</p>
              <p className="text-lg font-bold text-slate-900">2,310</p>
            </div>
            <Button className="bg-teal-700 text-white hover:bg-teal-800">
              <Play className="mr-1 h-4 w-4" />
              Continue
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-700" />
                Todays Missions
              </CardTitle>
              <CardDescription>
                Small wins that build your mastery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission.title}
                  className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-800">
                    {mission.title}
                  </span>
                  <span
                    className={
                      mission.done
                        ? 'rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700'
                        : 'rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700'
                    }
                  >
                    {mission.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Last 7 quiz scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-end gap-2">
                {weeklyScores.map((score, idx) => (
                  <div
                    key={idx}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-md bg-teal-600/90"
                      style={{
                        height: ((score / maxScore) * 100).toFixed(0) + '%',
                      }}
                    />
                    <span className="text-xs text-slate-500">D{idx + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Recommended Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {recommendations.map((quiz) => (
                <div key={quiz.title} className="rounded-lg border p-3">
                  <p className="font-semibold text-slate-900">{quiz.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{quiz.category}</p>
                  <p className="mt-3 text-xs text-slate-600">
                    {quiz.questions} questions
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Start
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-xl font-bold">26</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Avg Score</p>
                <p className="text-xl font-bold">83%</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Streak</p>
                <p className="flex items-center gap-1 text-xl font-bold">
                  <Flame className="h-4 w-4 text-orange-500" />7
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Rank</p>
                <p className="text-xl font-bold">#2</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <p className="text-sm font-medium">
                    #{idx + 1} {entry.name}
                  </p>
                  <p className="text-xs text-slate-600">{entry.xp} XP</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-teal-700" />
                Rewards
              </CardTitle>
              <CardDescription>Next badge: Science Specialist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[68%] rounded-full bg-teal-600" />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                68 percent completed
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <Star className="mr-1 h-4 w-4" />
                View all badges
              </Button>
            </CardContent>
          </Card>

          {role === 'Educator' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Class Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>Active classrooms: 3</p>
                <p>Quizzes created: 18</p>
                <p>Pending submissions: 7</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
