import { Button } from '@/components/ui/button';
import { Placeholder } from './placeholder';

export default function Learn() {
  return (
    <div className="mx-auto my-32 items-center">
      <section
        id="learn"
        className="container mx-auto flex flex-col justify-center gap-10 sm:w-full sm:flex-row"
      >
        <div className="max-w-md">
          <h2 className="font-heading ml-2 text-4xl font-bold text-white sm:ml-4">
            Start To Learn
          </h2>
          <p className="mx-2 mt-6 mb-6 text-justify wrap-normal text-white sm:mx-0 sm:ml-4">
            Here is our recommmended quiz for you to start learning! Try it out
            and see how much you know about the world!
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button className="mt-6 w-full max-w-72 cursor-pointer bg-blue-500 px-4 py-6 hover:bg-blue-600 sm:mt-0 sm:max-w-full sm:translate-x-8">
            Start Learning!
          </Button>
        </div>
      </section>
    </div>
  );
}
