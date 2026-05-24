import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import redis from '@/lib/redis';
import { resolveSession } from '@/lib/quiz-session';
import { prisma } from '@/lib/prisma';
