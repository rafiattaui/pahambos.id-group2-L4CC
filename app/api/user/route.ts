import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { APIError, handleError } from '@/lib/api/errors';
import { UserPublicSchema, UserUpdateSchema } from '@/lib/schemas/userschemas';
import { NextRequest } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

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

    if (!data.name) {
      throw new APIError('Name is required', 400);
    }

    const res = await auth.api.updateUser({
      body: data,
      headers: await headers(),
    });

    return Response.json({ ...res, name: data.name }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @summary Update user profile picture
 * @description Currently used for updating user's profile picture.
 * @body UserUpdateSchema
 * @response 200:UserPublicSchema
 * @add 400:APIErrorSchema
 * @add 401:APIErrorSchema
 * @auth cookieAuth
 * @tag User
 * @openapi
 */
export async function PUT(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      throw new APIError('Invalid form data', 400);
    }

    const imageFile = formData.get('imageFile') as File | null;

    if (!imageFile) {
      throw new APIError('No image file provided', 400);
    }

    const { imageUrl } = await uploadImage(
      imageFile,
      'quiz-app/profile-pictures'
    );

    const res = await auth.api.updateUser({
      body: { image: imageUrl },
      headers: await headers(),
    });

    return Response.json({ ...res }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
