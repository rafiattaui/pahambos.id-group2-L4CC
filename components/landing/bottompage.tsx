import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import FadeInSection from '@/components/animation/fade-in-section';

export default function BottomPage() {
  const steps = [
    {
      number: '01',
      title: 'Sign Up',
      desc: 'Create your free account in seconds.',
    },
    {
      number: '02',
      title: 'Pick a Quiz',
      desc: 'Browse 7 categories and choose your topic.',
    },
    {
      number: '03',
      title: 'Start Learning',
      desc: 'Answer questions and track your progress.',
    },
  ];
  return (
    <div className="flex flex-col justify-center gap-32 py-8">
      <FadeInSection>
        <div className="flex flex-col items-center gap-8">
          <h2 className="font-body text-center text-3xl font-bold text-slate-800">
            The Numbers Speak for Themselves{' '}
          </h2>
          <div className="mx-auto flex max-w-lg justify-center gap-4 divide-x divide-slate-200 rounded-2xl border border-slate-100 bg-white px-8 py-6 shadow-sm">
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
        <div className="w-full bg-white p-4">
          <h2 className="font-body mb-8 text-center text-3xl font-bold text-slate-800">
            How It Works
          </h2>
          <div className="my-16 flex flex-col justify-center gap-6 px-8 md:flex-row">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex-1 rounded-2xl bg-white p-6 text-center shadow-sm"
              >
                <p className="font-body mb-2 text-4xl font-black text-orange-400">
                  {step.number}
                </p>
                <p className="font-body mb-1 text-lg font-bold text-slate-800">
                  {step.title}
                </p>
                <p className="font-body text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      <FadeInSection>
        <div>
          <section className="mx-4 mb-16 rounded-3xl bg-blue-600 px-8 py-16 text-center md:mx-16">
            <h2 className="font-body mb-4 text-4xl font-bold text-white">
              Ready to Start Learning?
            </h2>
            <p className="font-body mx-auto mb-8 max-w-md text-lg text-blue-100">
              Join thousands of students already learning with PahamBos.
              It&apos;s free to get started!
            </p>
            <div className="flex justify-center gap-4">
              <a href="/register">
                <Button className="font-body rounded-xl bg-white px-8 py-6 font-bold text-blue-600 transition-all hover:scale-105 hover:bg-orange-50">
                  Get Started Free <ArrowRight />
                </Button>
              </a>
              <a href="/search">
                <Button className="font-body rounded-xl border-white bg-white px-8 py-6 font-bold text-blue-600 transition-all hover:scale-105 hover:bg-orange-50">
                  Browse Quizzes
                </Button>
              </a>
            </div>
          </section>
        </div>
      </FadeInSection>
    </div>
  );
}
