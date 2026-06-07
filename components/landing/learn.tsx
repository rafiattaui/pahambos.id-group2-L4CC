'use client';
import { Button } from '@/components/ui/button';
import { Placeholder } from './placeholder';
import { useRouter } from 'next/navigation';

export default function Learn() {
  const router = useRouter();
  return (
    <div className="mx-auto my-32 max-w-4xl items-center rounded-lg bg-white py-16 shadow-md">
      <section
        id="learn"
        className="container mx-auto flex flex-col justify-center gap-10 sm:w-full sm:flex-row"
      >
        <div className="max-w-md">
          <h2 className="font-body ml-2 text-4xl font-bold text-slate-800 sm:ml-4">
            Start To Learn
          </h2>
          <p className="font-body mx-2 mt-6 mb-6 text-justify wrap-normal text-slate-700 sm:mx-0 sm:ml-4">
            Here is our recommmended quiz for you to start learning! Try it out
            and see how much you know about the world!
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button
            className="font-body mt-6 w-full max-w-72 cursor-pointer bg-blue-600 px-4 py-6 font-bold hover:scale-105 hover:bg-blue-700 sm:mt-0 sm:max-w-full sm:translate-x-8"
            onClick={() => {
              router.push('/dashboard/search');
            }}
          >
            Start Learning!
          </Button>
        </div>
      </section>
    </div>
  );
}
