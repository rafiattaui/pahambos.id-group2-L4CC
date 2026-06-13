'use client';
import { Button } from '@/components/ui/button';
import { Placeholder } from './placeholder';
import { useRouter } from 'next/navigation';

export default function Learn() {
  const router = useRouter();
  return (
    <div className="mx-auto my-32 max-w-4xl items-center rounded-lg bg-white py-16 shadow-md">
      <section className="container mx-auto flex flex-col justify-center gap-10 sm:w-full sm:flex-row">
        {/* Text — left */}
        <div className="ml-4 max-w-md">
          <h2 className="font-body ml-2 text-4xl font-bold text-slate-800 sm:ml-4">
            Start To Learn
          </h2>
          <p className="font-body mt-6 mb-6 ml-4 wrap-normal text-slate-700">
            Learning is not just about reading books, and remembering materials.
            You can having fun while learning by playing quizzes! <br />
            our quizzes also support features such as:
          </p>
          <p className="font-body mt-6 mb-6 ml-4 wrap-normal text-slate-700">
            the features include:
          </p>
          <ul className="font-body list-disc pl-5 text-slate-700">
            <li>
              Right or Wrong: indicate whether your answer is correct or wrong
            </li>
            <li>
              Hint System: helps you if you are stuck within a question to help
              you gain insight
            </li>
            <li>
              Time Limit: challenge your intellect and speed with time-limited
              questions
            </li>
            <li>Leaderboard: see how you rank against other learners</li>
          </ul>
        </div>

        {/* Image/Video + Button — right */}
        <div className="flex flex-col items-center p-3">
          <div className="relative mr-8 aspect-[3/2] w-full max-w-[700px] overflow-hidden rounded-lg shadow-[-14px_14px_10px_rgba(0,0,0,0.28)]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/learning_demo.mp4" type="video/mp4" />
            </video>
          </div>
          <Button
            className="font-body mt-6 mr-8 w-full max-w-[700px] cursor-pointer bg-blue-600 px-4 py-6 font-bold hover:scale-105 hover:bg-blue-700"
            onClick={() => router.push('/dashboard/search')}
          >
            Start Learning!
          </Button>
        </div>
      </section>
    </div>
  );
}
