import { z, ZodObject } from 'zod';
import { CategoryEnum } from './quizschemas';
import { APIError } from '../api/errors';

export function parseQueryParams(params: URLSearchParams, schema: ZodObject){
    const result = schema.safeParse(Object.fromEntries(params));

    if (!result.success) {
        throw new APIError("Invalid query parameters", 400)
    }

    return result.data
}

export const QuizListQuerySchema = z.object({
    page: z.coerce.number().default(1),
    sortBy: z.enum(['newest', 'oldest', 'trending']),
    tags: z.array(CategoryEnum).optional()
})