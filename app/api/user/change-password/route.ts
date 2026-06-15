import { handleError } from '@/lib/api/errors';
import { auth } from '@/lib/auth';
import { UserChangePasswordSchema } from '@/lib/schemas/userschemas';
import { headers } from 'next/dist/server/request/headers';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';

export async function PATCH(request: NextRequest) {
  try {
    const rawData = await request.json();
    const data = UserChangePasswordSchema.parse(rawData);

    const res = await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true, // optional, defaults to false
      },
      headers: await headers(),
    });

    return Response.json(
      { success: true, message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
