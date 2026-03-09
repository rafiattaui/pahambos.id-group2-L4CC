import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { APIError, handleError } from '@/lib/api/errors';
import { UserPartialSchema, UserPublicSchema } from '@/lib/schemas/userschemas';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/user:
 * get:
 * summary: Get current user profile
 * description: Retrieves the public profile of the currently authenticated user based on the session.
 * tags:
 * - User
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: User profile retrieved successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id: { type: string, format: uuid }
 * email: { type: string, format: email }
 * name: { type: string }
 * image: { type: string, format: url, nullable: true }
 * emailVerified: { type: boolean }
 * role: { type: string, enum: [Learner, Educator] }
 * createdAt: { type: string, format: date-time }
 * 401:
 * description: Unauthorized - No active session found
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
 * @swagger
 * /api/user:
 * patch:
 * summary: Update user profile
 * description: Updates specific fields of the user profile. Only provided fields will be modified.
 * tags:
 * - User
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * image:
 * type: string
 * format: url
 * nullable: true
 * role:
 * type: string
 * enum: [Learner, Educator]
 * responses:
 * 200:
 * description: User updated successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id: { type: string, format: uuid }
 * email: { type: string, format: email }
 * name: { type: string }
 * image: { type: string, format: url, nullable: true }
 * role: { type: string, enum: [Learner, Educator] }
 * 400:
 * description: Invalid request data
 * 401:
 * description: Unauthorized
 */
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
