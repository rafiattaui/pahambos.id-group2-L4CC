import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';

export const POST = WithAuth(async (req, { user }) => {
  try {
    return NextResponse.json({
      success: true,
      message: 'Classroom endpoint is working!',
    });
  } catch (error) {
    return handleError(error);
  }
});
