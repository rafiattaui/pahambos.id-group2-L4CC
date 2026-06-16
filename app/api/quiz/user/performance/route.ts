import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// retrieve all performance records
// for user
export const GET = WithAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    // Query params: ?page=1&limit=10 (both optional, defaults to page=1, limit=10)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    );
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.userPerformance.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userPerformance.count({
        where: { userId: user.id },
      }),
    ]);

    if (total === 0) {
      return NextResponse.json({
        success: false,
        message: 'No performance records were found for user.',
      });
    }

    return NextResponse.json({
      success: true,
      data: records,
      // Pagination metadata — use this to render page controls
      // Example response:
      // {
      //   total: 38,        → total number of records across all pages
      //   page: 2,          → current page
      //   limit: 10,        → records per page (max 50)
      //   totalPages: 4,    → use this to render page number buttons
      //   hasNext: true,    → show/hide next button
      //   hasPrev: true,    → show/hide prev button
      // }
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
