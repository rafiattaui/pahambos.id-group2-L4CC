import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Create() {
  return (
    <div className="my-96">
      <section id="create" className="container mx-auto flex w-full flex-row">
        <div>
          <h2 className="font-heading ml-4 text-4xl font-bold text-white">
            Create
          </h2>
          <p className="mt-6 mb-6 ml-4 text-white">
            Design your own quiz and share it with others!
          </p>
        </div>
        <div className="ml-64 flex flex-col items-center">
          <Image
            src={'/create Quiz placeholder.png'}
            alt="Create Quiz Placeholder"
            width={400}
            height={300}
          />
          <Button className="mt-4 w-32 bg-blue-500 px-4 py-6 hover:bg-blue-600">
            Start Creating!
          </Button>
        </div>
      </section>
    </div>
  );
}
