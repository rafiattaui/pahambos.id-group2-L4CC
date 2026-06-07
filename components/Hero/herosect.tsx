'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

import { authClient } from '@/lib/auth-client';

function PencilDecor() {
  return (
    <svg
      viewBox="0 0 120 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-24 opacity-80 sm:w-32"
      aria-hidden="true"
    >
      {/* Pencil body */}
      <rect
        x="35"
        y="40"
        width="50"
        height="240"
        rx="6"
        fill="#FED7AA"
        stroke="#FB923C"
        strokeWidth="2.5"
      />
      {/* Pencil stripe top */}
      <rect x="35" y="40" width="50" height="22" rx="6" fill="#FB923C" />
      {/* Pencil metal band */}
      <rect x="35" y="255" width="50" height="18" rx="2" fill="#94A3B8" />
      {/* Eraser */}
      <rect x="38" y="273" width="44" height="16" rx="4" fill="#FDA4AF" />
      {/* Pencil tip (triangle) */}
      <path
        d="M35 280 L85 280 L60 330 Z"
        fill="#FED7AA"
        stroke="#FB923C"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Wood reveal */}
      <path d="M44 280 L76 280 L60 316 Z" fill="#D97706" opacity="0.4" />
      {/* Graphite tip */}
      <path d="M54 316 L66 316 L60 330 Z" fill="#334155" />
      {/* Pencil lines detail */}
      <line
        x1="35"
        y1="90"
        x2="85"
        y2="90"
        stroke="#FB923C"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1="35"
        y1="130"
        x2="85"
        y2="130"
        stroke="#FB923C"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Stars / sparkles around pencil */}
      <circle cx="15" cy="100" r="4" fill="#FED7AA" opacity="0.7" />
      <circle cx="108" cy="70" r="3" fill="#FB923C" opacity="0.6" />
      <circle cx="10" cy="200" r="3" fill="#FB923C" opacity="0.5" />
      <path
        d="M100 150 L104 158 L112 158 L106 163 L108 171 L100 166 L92 171 L94 163 L88 158 L96 158 Z"
        fill="#FED7AA"
        opacity="0.7"
      />
    </svg>
  );
}

function LightbulbDecor() {
  return (
    <svg
      viewBox="0 0 200 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-28 opacity-90 sm:w-40"
      aria-hidden="true"
    >
      {/* Soft glow behind */}
      <ellipse
        cx="100"
        cy="200"
        rx="68"
        ry="75"
        fill="#FED7AA"
        opacity="0.25"
      />

      {/* === Wifi waves LEFT (orange) === */}
      <path
        d="M52 148 Q32 168 32 190"
        stroke="#FB923C"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M62 132 Q28 158 28 196"
        stroke="#F97316"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* === Wifi waves RIGHT (blue) === */}
      <path
        d="M148 148 Q168 168 168 190"
        stroke="#2563EB"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M138 132 Q172 158 172 196"
        stroke="#3B82F6"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* === Bulb body — rounded teardrop === */}
      <path
        d="M100 80
           C 128 80, 148 102, 148 130
           C 148 152, 138 168, 124 182
           C 116 190, 112 200, 112 214
           L 88 214
           C 88 200, 84 190, 76 182
           C 62 168, 52 152, 52 130
           C 52 102, 72 80, 100 80 Z"
        fill="#F97316"
        stroke="#EA580C"
        strokeWidth="2"
      />

      {/* Bulb shine highlight */}
      <ellipse
        cx="84"
        cy="108"
        rx="7"
        ry="12"
        fill="white"
        opacity="0.35"
        transform="rotate(-15 84 108)"
      />
      <circle cx="92" cy="97" r="3" fill="white" opacity="0.25" />
      {/* === Inner bulb / filament — no face === */}
      {/* Inner glass */}
      <ellipse cx="100" cy="145" rx="28" ry="32" fill="#FED7AA" opacity="0.3" />
      {/* Filament left leg */}
      <line
        x1="88"
        y1="172"
        x2="88"
        y2="155"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Filament right leg */}
      <line
        x1="112"
        y1="172"
        x2="112"
        y2="155"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Filament coil */}
      <path
        d="M88 155 Q94 143 100 150 Q106 157 112 145"
        stroke="#EA580C"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Filament glow dot */}
      <circle cx="100" cy="148" r="5" fill="#FED7AA" opacity="0.6" />

      {/* === Base rings === */}
      <rect x="84" y="214" width="32" height="9" rx="3" fill="#94A3B8" />
      <rect x="86" y="223" width="28" height="9" rx="2" fill="#CBD5E1" />
      <rect x="88" y="232" width="24" height="9" rx="2" fill="#94A3B8" />
      <rect x="90" y="241" width="20" height="10" rx="3" fill="#CBD5E1" />

      {/* Sparkle dots */}
      <circle cx="160" cy="100" r="4" fill="#FED7AA" opacity="0.9" />
      <circle cx="40" cy="230" r="3" fill="#FB923C" opacity="0.7" />
      <circle cx="170" cy="250" r="3" fill="#93C5FD" opacity="0.7" />
    </svg>
  );
}

export default function HeroSect() {
  const { data: session } = authClient.useSession();
  const ctaHref = session ? '/dashboard' : '/register';
  return (
    <div>
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {/* Decorative dots pattern background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle, #93c5fd 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Left pencil — floats with gentle animation */}
        <div
          className="pointer-events-none absolute bottom-16 left-0 hidden items-end md:flex"
          style={{ animation: 'floatY 5s ease-in-out infinite' }}
        >
          <PencilDecor />
        </div>

        {/* Right lightbulb */}
        <div
          className="pointer-events-none absolute top-20 right-0 hidden items-start md:flex"
          style={{ animation: 'floatY 6s ease-in-out infinite reverse' }}
        >
          <LightbulbDecor />
        </div>

        {/* Floating animation keyframes */}
        <style>{`
          @keyframes floatY {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-18px); }
          }
        `}</style>

        {/* Hero content */}
        <h1 className="font-heading relative text-5xl leading-none font-black sm:text-6xl">
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 -z-10 text-white blur-xs [text-shadow:-2px_2px_4px_rgba(255,255,255,0.2)]"
          >
            PahamBos.id
          </span>
          <span className="text-blue-600">Paham</span>
          <span className="text-orange-500">Bos</span>
          <span className="text-slate-400">.id</span>
        </h1>

        <p className="font-body mt-6 max-w-xl px-4 text-center text-lg text-slate-600">
          The Learning platform for everyone, where you can discover, learn, and
          create with ease. <br />
          Join us today and unlock your full potential!
        </p>

        <div className="mt-10 flex w-full max-w-md flex-row items-center justify-center gap-4">
          <a href={ctaHref} className="w-full max-w-72 sm:w-auto">
            <Button className="w-full max-w-72 cursor-pointer items-center bg-blue-600 px-6 py-6 hover:scale-110 hover:bg-blue-700 active:scale-105 sm:w-72">
              Get Started <ArrowRight />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
