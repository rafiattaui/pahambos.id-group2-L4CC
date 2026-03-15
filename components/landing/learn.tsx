import { Button } from '@/components/ui/button';
import { Placeholder } from './placeholder';

export default function Learn() {
  return (
    <div className="mx-auto my-96 items-center">
      <section
        id="learn"
        className="container mx-auto flex flex-col justify-center gap-10 sm:w-full sm:flex-row"
      >
        <div className="max-w-md">
          <h2 className="font-heading ml-4 text-4xl font-bold text-white">
            Start To Learn
          </h2>
          <p className="mt-6 mb-6 ml-4 text-justify wrap-normal text-white">
            Here is our recommmended quiz for you to start learning! Explore and
            find the quizzes that suit your interests and learning goals!
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button className="mt-4 w-full translate-x-8 bg-blue-500 px-4 py-6 hover:bg-blue-600">
            Start Learning!
          </Button>
        </div>
      </section>
    </div>
  );
}
