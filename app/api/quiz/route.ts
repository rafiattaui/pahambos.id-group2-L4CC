import { handleError } from '@/lib/api/errors';
import { NextRequest } from 'next/server';

export async function POST(Request: NextRequest) {
  try {
  } catch (error) {
    return handleError(error);
  }
}
