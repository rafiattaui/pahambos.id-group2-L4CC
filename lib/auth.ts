import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { nextCookies } from 'better-auth/next-js';
import { openAPI } from 'better-auth/plugins';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
      },
    },
  },
  trustedOrigins: ['http://localhost:3000'],
  advanced: {
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === 'production',
    },
    database: {
      generateId: 'uuid',
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [nextCookies(), openAPI()],
  emailAndPassword: {
    enabled: true,
  },
  // TODO - include google authentication
});
