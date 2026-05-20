import { authClient } from '@/lib/auth-client';
import { NextResponse, NextRequest } from 'next/server';
import { rateLimit } from '@/lib/ratelimiter';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  console.log('Rate limiting request to /api/proxy');
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed, remaining, resetIn } = await rateLimit(ip);

  if (!allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'Retry-After': String(resetIn),
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Remaining', String(remaining));
  return res;
}
