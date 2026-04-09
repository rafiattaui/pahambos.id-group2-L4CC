import { authClient } from '@/lib/auth-client';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const session = await authClient.getSession();

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return Response.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

// TODO - FIX
