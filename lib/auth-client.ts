import { createAuthClient } from 'better-auth/react';
import { NextRequest } from 'next/server';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
});

export async function isAuthenticated(request: NextRequest) {
  const data = await authClient.getSession();

  return data === null;
}
