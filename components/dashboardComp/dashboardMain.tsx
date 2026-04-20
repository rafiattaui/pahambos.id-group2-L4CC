'use client';

import { Button } from '@/components/ui/button';
//import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
//import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Play, Users, Trophy, Rocket } from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from '../ui/input-group';

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

export default function DashboardMain() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="from 10% via 50% to 70% relative h-72 overflow-hidden rounded-2xl bg-linear-to-br from-blue-400 via-blue-300 to-blue-100 p-6">
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Hello, User!
          </h1>
          <p className="font-body-bold mt-4 text-slate-700">
            Let&apos;s learn something new today!
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Play className="mr-2 h-4 w-4" />
              Start Live Quiz
            </Button>
            <Button variant="outline">Browse Quiz Sets</Button>
          </div>
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-white p-6">
          <InputGroup className="h-14 max-w-2xs inset-shadow-sm">
            <InputGroupInput placeholder="Enter a code to join a quiz" />
            <InputGroupButton className="m-2 aspect-square h-9 w-12 bg-blue-400 text-white hover:bg-blue-600 hover:text-white active:translate-y-1">
              Join
            </InputGroupButton>
          </InputGroup>
        </div>
      </div>

      <div className="space-y-4"></div>
    </section>
  );
}
