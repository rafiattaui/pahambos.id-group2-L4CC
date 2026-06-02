import { LoginForm } from '@/components/login-form';
import ImageSlideshow from '@/components/image-slideshow';
import NavbarLogin from '@/components/header/navbarlogin';

export default async function loginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex min-h-svh flex-col">
        <div className="sticky top-0 z-50 w-full bg-white/20 backdrop-blur-md">
          <NavbarLogin />
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-lg">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden h-full w-full lg:block">
        <ImageSlideshow />
      </div>
    </div>
  );
}
