import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { APIError, handleError } from '@/lib/api/errors';
import { UserPartialSchema, UserPublicSchema } from '@/lib/schemas/userschemas';
import { NextRequest } from 'next/server';

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

export async function PATCH(request: NextRequest) {
  try {
    const rawData = await request.json();
    const data = UserPartialSchema.parse(rawData);

    const res = await auth.api.updateUser({
      body: data,
      headers: await headers(),
    });

    return Response.json({ ...res }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
