import ImageSlideshow from '@/components/image-slideshow';
import { SignupForm } from '@/components/signup-form';
import Navbar from '@/components/header/navbar';

export default async function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-md">
        <Navbar />
      </header>
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-lg">
              <SignupForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <ImageSlideshow />
        </div>
      </div>
    </div>
  );
}
