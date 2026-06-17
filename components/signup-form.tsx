'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  // FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { AlertDestructive } from './alert';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const safeNext =
    next && next.startsWith('/') && !next.startsWith('//') ? next : null;

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    setIsLoading(true);
    setFormError(null);
    e.preventDefault();
    const formData = Object.fromEntries(
      new FormData(e.currentTarget)
    ) as Record<string, string>;

    const { username, email, password, confirmpw } = formData;

    // handle possible null values
    try {
      if (!email || !username || !password || !confirmpw) {
        throw new Error('All fields must be answered.');
      }

      // password confirmation logic
      if (password != confirmpw) {
        throw new Error('Passwords are different.');
      }

      if (password.length < 8) {
        throw new Error('Password must be longer than 8 characters.');
      }

      await authClient.signUp.email(
        {
          email, // user email address
          password, // user password -> min 8 characters by default
          name: username, // user display name
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: () => {
            setIsLoading(false);
            router.push(safeNext ?? '/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            // display the error message
            setIsLoading(false);
            throw new Error(ctx.error.message);
          },
        }
      );
    } catch (err: unknown) {
      setIsLoading(false);
      setFormError({
        title: 'Registration Failed',
        description: (err as Error).message,
      });
    }
  };

  return (
    <div>
      {formError && (
        <AlertDestructive
          title={formError.title}
          description={formError.description}
        />
      )}
      <form
        onSubmit={onSubmit}
        className={cn('flex flex-col gap-6', className)}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-body text-2xl font-bold">
              Create your account
            </h1>
            <p className="font-body text-sm text-balance text-black">
              Fill in the form below to create your account
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="name" className="font-body">
              Username
            </FieldLabel>
            <Input
              id="name"
              name="username"
              type="text"
              placeholder="John Doe"
              className="font-body bg-white/10"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email" className="font-body">
              Email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              className="font-body bg-white/10"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password" className="font-body">
              Password
            </FieldLabel>
            <Input
              name="password"
              id="password"
              type="password"
              className="font-body bg-white/10"
              required
            />
            <FieldDescription className="font-body text-black">
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password" className="font-body">
              Confirm Password
            </FieldLabel>
            <Input
              name="confirmpw"
              id="confirm-password"
              type="password"
              className="font-body bg-white/10"
              required
            />
            <FieldDescription className="font-body text-black">
              Please confirm your password.
            </FieldDescription>
          </Field>
          <Field>
            <Button
              disabled={isLoading}
              type="submit"
              className="font-body w-full bg-blue-500 hover:bg-blue-700"
            >
              Create Account
            </Button>
          </Field>
          {/* <FieldSeparator>Or continue with</FieldSeparator> */}
          <Field>
            {/* <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Sign up with GitHub
          </Button> */}
            <FieldDescription className="font-body px-6 text-center text-black">
              Already have an account?{' '}
              <a
                href="/login"
                className="underline underline-offset-4 hover:text-blue-600!"
              >
                Sign in
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
