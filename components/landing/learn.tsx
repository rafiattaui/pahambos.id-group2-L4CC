import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Learn() {
  return (
    <div className="my-96">
      <section id="learn" className="container mx-auto flex w-full flex-row">
        <div>
          <h2 className="font-heading ml-4 text-4xl font-bold text-white">
            Learn
          </h2>
          <p className="mt-6 mb-6 ml-4 text-white">
            Start your first lesson with our recommended quiz only for you!
          </p>
        </div>
        <div className="ml-32 flex flex-col items-center">
          <Image
            src={'/Quiz placeholder.png'}
            alt="Quiz Placeholder"
            width={400}
            height={300}
          />
          <Button className="mt-4 w-32 bg-blue-500 px-4 py-6 hover:bg-blue-600">
            Start Learning!
          </Button>
        </div>
      </section>
    </div>
  );
}
