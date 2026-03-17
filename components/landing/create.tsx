import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Placeholder } from './placeholder';

export default function Create() {
  return (
    <div className="my-32">
      <section
        id="create"
        className="container mx-auto flex flex-col-reverse justify-center gap-10 sm:w-full sm:flex-row"
      >
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button className="mt-6 w-full max-w-72 cursor-pointer bg-blue-500 px-4 py-6 hover:bg-blue-600 sm:mt-0 sm:max-w-full sm:translate-x-8">
            Create Now!
          </Button>
        </div>
        <div className="max-w-md">
          <h2 className="font-heading ml-4 text-4xl font-bold text-white">
            Create Your Own Quiz
          </h2>
          <p className="mt-6 mb-6 ml-4 wrap-normal text-white">
            Create your own quizzes to help others learn and have fun! Share
            your knowledge and challenge others with your unique quizzes.
          </p>
        </div>
      </section>
    </div>
  );
}
