import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { APIError, handleError } from '@/lib/api/errors';
import { UserPublicSchema, UserUpdateSchema } from '@/lib/schemas/userschemas';
import { NextRequest } from 'next/server';

/**
 * @summary Get current session user
 * @description Retrieves the authenticated user's profile information using Better-Auth session.
 * @response 200:UserPublicSchema
 * @add 401:APIErrorSchema
 * @auth cookieAuth
 * @tag User
 * @openapi
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new APIError('Failed to retrieve session.', 401);
    }

    const user = UserPublicSchema.parse(session.user);

    return Response.json({ ...user }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @summary Update user profile
 * @description Updates the current user's information. Only partial data is required.
 * @body UserUpdateSchema
 * @response 200:UserPublicSchema
 * @add 400:APIErrorSchema
 * @add 401:APIErrorSchema
 * @auth cookieAuth
 * @tag User
 * @openapi
 */
export async function PATCH(request: NextRequest) {
  try {
    const rawData = await request.json();
    const data = UserUpdateSchema.parse(rawData);

    const res = await auth.api.updateUser({
      body: data,
      headers: await headers(),
    });

    return Response.json({ ...res }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
