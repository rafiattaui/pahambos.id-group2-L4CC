'use client';
import { useRouter } from 'next/navigation';
import { dashboardHref } from '@/components/dashboardComp/dashboardHref';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import FadeInSection from '@/components/animation/fade-in-section';
import Image from 'next/image';
import Link from 'next/link';

export default function BottomPage() {
  const { data: session } = authClient.useSession();
  const ctaHref = session ? '/dashboard' : '/register';
  const steps = [
    {
      number: '01',
      title: 'Sign Up',
      desc: 'Create your free account in seconds.',
      image: '/sign_up.png',
    },
    {
      number: '02',
      title: 'Pick a Quiz',
      desc: 'Browse 7 categories and choose your topic.',
      image: '/quiz_pop_up.png',
    },
    {
      number: '03',
      title: 'Start Learning',
      desc: 'Answer questions and track your progress.',
      image: '/games.png',
    },
  ];
  return (
    <div className="flex flex-col justify-center gap-32 py-8">
      <FadeInSection>
        <div className="flex flex-col items-center gap-8">
          <h2 className="font-body text-center text-3xl font-bold text-slate-800">
            The Numbers Speak for Themselves{' '}
          </h2>
          <div className="mx-auto flex max-w-lg flex-col justify-center gap-4 divide-y divide-slate-200 rounded-2xl border border-slate-100 bg-white px-8 py-6 shadow-sm sm:flex-row sm:divide-x sm:divide-y-0">
            <div className="0 px-8 py-6 text-center">
              <p className="font-body text-3xl font-bold text-blue-600">
                10000+
              </p>
              <p className="font-body text-sm text-slate-500">Active Users</p>
            </div>
            <div className="px-8 py-6 text-center">
              <p className="font-body text-3xl font-bold text-orange-500">
                500+
              </p>
              <p className="font-body text-sm text-slate-500">Quizzes</p>
            </div>
            <div className="px-8 py-6 text-center">
              <p className="font-body text-3xl font-bold text-blue-600">7</p>
              <p className="font-body text-sm text-slate-500">Categories</p>
            </div>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection>
        <section className="my-20">
          <h2 className="font-body mb-12 text-center text-4xl font-bold text-slate-800">
            How It Works
          </h2>

          <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image — 16:9 */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                  {/* Number badge overlay */}
                  <div className="font-body absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-400 text-lg font-black text-white shadow-md">
                    {step.number}
                  </div>
                </div>

                {/* Text content */}
                <div className="p-5 text-center">
                  <p className="font-body text-lg font-bold text-slate-800">
                    {step.title}
                  </p>
                  <p className="font-body mt-1 text-sm text-slate-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <div>
          <section className="relative mx-4 mb-16 overflow-hidden rounded-3xl bg-blue-600 px-8 py-16 text-center md:mx-16">
            {/* Dot pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Left — Notebook + Pencil, vertically centered */}
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center pl-6 opacity-30 md:flex">
              <svg
                viewBox="0 0 180 220"
                className="w-40 lg:w-48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Notebook body */}
                <rect
                  x="10"
                  y="10"
                  width="110"
                  height="140"
                  rx="8"
                  stroke="white"
                  strokeWidth="4"
                />
                {/* Spine */}
                <rect
                  x="10"
                  y="10"
                  width="18"
                  height="140"
                  rx="6"
                  stroke="white"
                  strokeWidth="4"
                />
                {/* Spiral rings */}
                <circle cx="19" cy="35" r="6" stroke="white" strokeWidth="3" />
                <circle cx="19" cy="57" r="6" stroke="white" strokeWidth="3" />
                <circle cx="19" cy="79" r="6" stroke="white" strokeWidth="3" />
                <circle cx="19" cy="101" r="6" stroke="white" strokeWidth="3" />
                <circle cx="19" cy="123" r="6" stroke="white" strokeWidth="3" />
                {/* Page lines */}
                <line
                  x1="38"
                  y1="42"
                  x2="108"
                  y2="42"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="38"
                  y1="58"
                  x2="108"
                  y2="58"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="38"
                  y1="74"
                  x2="108"
                  y2="74"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="38"
                  y1="90"
                  x2="108"
                  y2="90"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="38"
                  y1="106"
                  x2="85"
                  y2="106"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Pencil — diagonal, overlapping bottom-right of notebook */}
                <g transform="rotate(-35 130 160)">
                  {/* Pencil body */}
                  <rect
                    x="118"
                    y="80"
                    width="20"
                    height="90"
                    rx="4"
                    stroke="white"
                    strokeWidth="3.5"
                  />
                  {/* Eraser band */}
                  <rect
                    x="118"
                    y="80"
                    width="20"
                    height="14"
                    rx="4"
                    stroke="white"
                    strokeWidth="3"
                  />
                  {/* Tip triangle */}
                  <path
                    d="M118 170 L138 170 L128 195 Z"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {/* Graphite point */}
                  <line
                    x1="128"
                    y1="190"
                    x2="128"
                    y2="195"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
                {/* Sparkle star top-right */}
                <path
                  d="M155 18 L157 25 L164 25 L158 30 L161 37 L155 32 L149 37 L151 30 L145 25 L152 25 Z"
                  stroke="white"
                  strokeWidth="1.8"
                />
                {/* Small dot accents */}
                <circle cx="10" cy="170" r="3" stroke="white" strokeWidth="2" />
                <circle cx="170" cy="60" r="3" stroke="white" strokeWidth="2" />
              </svg>
            </div>

            {/* Right — Lightbulb with rays, vertically centered */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-6 opacity-30 md:flex">
              <svg
                viewBox="0 0 180 220"
                className="w-40 lg:w-48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Ray top */}
                <line
                  x1="90"
                  y1="8"
                  x2="90"
                  y2="22"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Ray top-left */}
                <line
                  x1="50"
                  y1="22"
                  x2="60"
                  y2="32"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Ray top-right */}
                <line
                  x1="130"
                  y1="22"
                  x2="120"
                  y2="32"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Ray left */}
                <line
                  x1="20"
                  y1="95"
                  x2="34"
                  y2="95"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Ray right */}
                <line
                  x1="160"
                  y1="95"
                  x2="146"
                  y2="95"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Ray bottom-left */}
                <line
                  x1="42"
                  y1="158"
                  x2="52"
                  y2="148"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Ray bottom-right */}
                <line
                  x1="138"
                  y1="158"
                  x2="128"
                  y2="148"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Bulb body */}
                <path
                  d="M90 36
                     C114 36 132 56 132 80
                     C132 98 122 112 112 124
                     C108 130 106 138 106 148
                     L74 148
                     C74 138 72 130 68 124
                     C58 112 48 98 48 80
                     C48 56 66 36 90 36 Z"
                  stroke="white"
                  strokeWidth="4"
                />
                {/* Base band 1 */}
                <rect
                  x="72"
                  y="148"
                  width="36"
                  height="10"
                  rx="3"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Base band 2 */}
                <rect
                  x="74"
                  y="158"
                  width="32"
                  height="10"
                  rx="2"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Base band 3 */}
                <rect
                  x="76"
                  y="168"
                  width="28"
                  height="10"
                  rx="2"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Filament */}
                <path
                  d="M76 128 L80 116 L86 122 L90 110 L94 122 L100 116 L104 128"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Shine */}
                <ellipse
                  cx="74"
                  cy="66"
                  rx="5"
                  ry="11"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.7"
                  transform="rotate(-15 74 66)"
                />
                {/* Sparkle */}
                <path
                  d="M158 140 L160 146 L166 146 L161 150 L163 156 L158 152 L153 156 L155 150 L150 146 L156 146 Z"
                  stroke="white"
                  strokeWidth="1.8"
                />
                <circle
                  cx="20"
                  cy="145"
                  r="3.5"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h2 className="font-body mb-4 text-4xl font-bold text-white">
              Ready to Start Learning?
            </h2>
            <p className="font-body mx-auto mb-8 max-w-md text-lg text-blue-100">
              Join thousands of students already learning with PahamBos.
              It&apos;s free to get started!
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={ctaHref}>
                <Button className="font-body rounded-md bg-white px-8 py-6 font-bold text-blue-600 transition-all hover:scale-105 hover:bg-blue-600 hover:text-white">
                  Get Started Free <ArrowRight />
                </Button>
              </Link>
              <Link href={dashboardHref('search')}>
                <Button className="font-body rounded-md border-white bg-white px-8 py-6 font-bold text-blue-600 transition-all hover:scale-105 hover:bg-blue-600 hover:text-white">
                  Browse Quizzes
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </FadeInSection>
    </div>
  );
}
