import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export const ApiErrors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse("BAD_REQUEST", message, 400, details),

  unauthorized: (message: string = "Authentication required.") =>
    createErrorResponse("UNAUTHORIZED", message, 401),

  forbidden: (message: string = "You do not have permission to perform this action.") =>
    createErrorResponse("FORBIDDEN", message, 403),

  notFound: (message: string = "Resource not found.") =>
    createErrorResponse("NOT_FOUND", message, 404),

  conflict: (code: string, message: string, details?: Record<string, unknown>) =>
    createErrorResponse(code, message, 409, details),

  internal: (message: string = "An unexpected server error occurred.") =>
    createErrorResponse("INTERNAL_SERVER_ERROR", message, 500),
};
