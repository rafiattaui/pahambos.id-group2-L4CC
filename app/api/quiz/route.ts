import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { CreateQuizAndQuestionsSchema } from '@/lib/schemas/quizschemas';
import { NextResponse } from 'next/server';

export const POST = WithAuth(async (req, { user, params }) => {
    try {
        const rawData = await req.json();
        const data = CreateQuizAndQuestionsSchema.parse(rawData);

        // TODO - quiz creation logic.

        return NextResponse.json({...data}, {status: 200})
    } catch (error) {   
        return handleError(error)
    }
});
