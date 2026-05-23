import { z, ZodObject } from 'zod';
import { CategoryEnum } from './quizschemas';
import { APIError } from '../api/errors';

function toObjectWithArrays(params: URLSearchParams) {
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of params.entries()) {
    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }

  return result;
}

export function parseQueryParams<T extends ZodObject>(
  params: URLSearchParams,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(toObjectWithArrays(params));

  if (!result.success) {
    throw new APIError('Invalid query parameters', 400);
  }

  return result.data;
}

export const QuizListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Max quizzes returned per query'),
  cursor: z.uuid().optional().describe('Cursor for Pagination'),
  sortBy: z
    .enum([
      'asc',
      'desc',
      // 'trending,'
      // TODO - How to calculate trending?
    ])
    .default('asc')
    .describe('Sort based on creation date'),
  tags: z
    .union([CategoryEnum, z.array(CategoryEnum)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .describe('Only return quizzes containing these tags'),
  name: z
    .string()
    .min(3)
    .optional()
    .describe('Search for quizzes with this name.'),
});
