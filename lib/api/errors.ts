import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import z from "zod";

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
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

// type for handler functions
type ErrorResponseHandler = (error: any) => Response;

const ERROR_HANDLERS: Array<{
  check: (error: unknown) => boolean;
  handle: ErrorResponseHandler;
}> = [
  {
    check: (err) => err instanceof PrismaClientKnownRequestError,
    handle: (err: PrismaClientKnownRequestError) => {
      switch (err.code) {
        case "P2025":
          return Response.json(
            {
              success: false,
              message: "Failed to find record",
              code: err.code,
              meta: err.meta,
            },
            { status: 404 },
          );

        case "P2002":
          return Response.json({
            success: false,
            message:
              (err.meta?.driverAdapterError as any)?.cause?.originalMessage ||
              "Unique constraint failed",
            code: err.code,
          });

        default: {
          return Response.json(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 },
          );
        }
      }
    },
  },
  {
    check: (err) => err instanceof z.ZodError,
    handle: (err: z.ZodError) =>
      Response.json(
        {
          success: false,
          message: "Validation failed",
          details: z.flattenError(err),
        },
        { status: 400 },
      ),
  },
  {
    check: (err) => err instanceof APIError,
    handle: (err: APIError) =>
      Response.json(
        {
          success: false,
          message: err.message,
          code: err.code,
          details: err.details,
        },
        { status: err.statusCode },
      ),
  },
  {
    check: (err) => err instanceof SyntaxError,
    handle: () =>
      Response.json(
        {
          success: false,
          message: "Invalid JSON format",
        },
        { status: 400 },
      ),
  },
];

export function handleError(error: unknown) {
  // Find the first handler that matches the error type
  const handler = ERROR_HANDLERS.find((h) => h.check(error));

  if (handler) {
    return handler.handle(error);
  }

  // Fallback for truly unknown errors
  console.error("[Unhandled Error]:", error);
  return Response.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 },
  );
}
