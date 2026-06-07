'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Placeholder } from './placeholder';
import { useRouter } from 'next/navigation';

export default function Create() {
  const router = useRouter();
  return (
    <div className="mx-auto my-32 max-w-4xl items-center rounded-lg bg-white py-16 shadow-md">
      <section
        id="create"
        className="container mx-auto flex flex-col-reverse justify-center gap-10 sm:w-full sm:flex-row"
      >
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button
            className="font-body mt-6 w-full max-w-72 cursor-pointer bg-blue-600 px-4 py-6 font-bold hover:bg-blue-600 sm:mt-0 sm:max-w-full sm:translate-x-8"
            onClick={() => {
              router.push('/dashboard/create');
            }}
          >
            Create Now!
          </Button>
        </div>
        <div className="max-w-md">
          <h2 className="font-body ml-4 text-4xl font-bold text-slate-800">
            Create Your Own Quiz
          </h2>
          <p className="font-body mt-6 mb-6 ml-4 wrap-normal text-slate-700">
            Create your own quizzes to help others learn and have fun! Share
            your knowledge and challenge others with your unique quizzes.
          </p>
        </div>
      </section>
    </div>
  );
}
