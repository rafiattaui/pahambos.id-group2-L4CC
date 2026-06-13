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
        <div className="flex flex-col items-center p-3">
          <div className="relative aspect-[3/2] w-full max-w-[700px] overflow-hidden rounded-lg shadow-[-14px_14px_10px_rgba(0,0,0,0.28)] sm:translate-x-8 sm:-translate-y-8">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/create_demo.mp4" type="video/mp4" />
            </video>
          </div>
          <Button
            className="font-body mt-6 w-full max-w-72 cursor-pointer bg-blue-600 px-4 py-6 font-bold hover:scale-105 hover:bg-blue-700 sm:mt-0 sm:max-w-full sm:translate-x-8"
            onClick={() => {
              router.push('/dashboard/create');
            }}
          >
            Create Now!
          </Button>
        </div>
        <div className="mr-4 max-w-md">
          <h2 className="font-body ml-4 text-4xl font-bold text-slate-800">
            Create Your Own Quiz
          </h2>
          <p className="font-body mt-6 mb-6 ml-4 wrap-normal text-slate-700">
            Create your own quiz and share it with the world! Our quiz creation
            is easy to use for new users. <br />
            the features include:
          </p>
          <ul className="font-body list-disc pl-5 text-slate-700">
            <li>
              Multiple question types: multiselect and single-select questions
            </li>
            <li>
              Customizable quiz settings: quiz details, question time limits and
              more
            </li>
            <li>
              Crop preview: allows you to preview your upload picture and adjust
              it if needed
            </li>
            <li>Draft save: save your progress and continue editing later</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
