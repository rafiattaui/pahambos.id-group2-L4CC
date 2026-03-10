import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Placeholder } from './placeholder';

export default function Create() {
  return (
    <div className="my-96">
      <section
        id="create"
        className="container mx-auto flex flex-col gap-6 sm:w-full sm:flex-row"
      >
        <div>
          <h2 className="font-heading ml-4 text-4xl font-bold text-white">
            Create
          </h2>
          <p className="mt-6 mb-6 ml-4 wrap-normal text-white">
            Design your own quiz and share it with others!
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Placeholder />
          <Button className="mt-4 w-32 bg-blue-500 px-4 py-6 hover:bg-blue-600">
            Start Creating!
          </Button>
        </div>
      </section>
    </div>
  );
}
