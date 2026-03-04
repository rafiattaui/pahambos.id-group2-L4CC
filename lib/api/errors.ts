import z, { success } from 'zod';

export function handleError(error: unknown) {
  if (error instanceof SyntaxError) {
    return Response.json(
      {
        success: false,
        message: 'Invalid JSON format in request body',
        code: 400,
      },
      { status: 400 }
    );
  }
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        success: false,
        message: 'Failed to validate schema',
        code: 400,
        details: z.flattenError(error),
      },
      { status: 400 }
    );
  } else if (error instanceof APIError) {
    return Response.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  } else {
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // suggested by gemini, for a proper stack trace.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
