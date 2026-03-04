import { z, ZodObject } from 'zod';
import { CategoryEnum } from './quizschemas';
import { APIError } from '../api/errors';

export function parseQueryParams<T extends ZodObject>(
  params: URLSearchParams,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(Object.fromEntries(params));

  if (!result.success) {
    throw new APIError('Invalid query parameters', 400);
  }

  return result.data;
}

export const QuizListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  cursor: z.uuid().optional(),
  sortBy: z
    .enum([
      'asc',
      'desc',
      // 'trending,'
      // TODO - How to calculate trending?
    ])
    .default('asc'),
  tags: z.array(CategoryEnum).optional(),
});
