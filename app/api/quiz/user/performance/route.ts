import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { success } from 'zod';

// retrieve all performance records
// for user
export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const records = await prisma.userPerformance.findMany({
      where: {
        userId: user.id,
      },
    });

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No performance records were found for user.',
      });
    }

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    return handleError(error);
  }
});
