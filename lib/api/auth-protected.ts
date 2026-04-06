import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth';
import { headers } from 'next/headers';
import { APIError, handleError } from './errors';
import { User } from '@/generated/prisma/client';

type AuthenticatedHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: Promise<T>; user: User }
) => Promise<Response>;

export function WithAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        throw new APIError('Unauthorized', 401);
      } else {
        return await handler(request, {
          ...context,
          user: session.user as User,
        });
        // weird typecasting due to image possibly being undefined or null.
      }
    } catch (error) {
      return handleError(error);
    }
  };
}
