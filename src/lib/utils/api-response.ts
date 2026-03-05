import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("api-response");

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ data, message }, { status });
}

export function errorResponse(
  error: string,
  status = 400,
  details?: unknown,
  code?: string
) {
  return NextResponse.json<ApiError>({ error, details, code }, { status });
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return errorResponse("Validation failed", 422, err.flatten(), "VALIDATION_ERROR");
  }

  if (err instanceof Error) {
    log.error({ err }, "API error");

    // Don't expose internal errors in production
    const message =
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

    return errorResponse(message, 500, undefined, "INTERNAL_ERROR");
  }

  return errorResponse("Unknown error", 500);
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function assertAuth(userId: string | undefined): asserts userId is string {
  if (!userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export function assertPlan(
  plan: string,
  required: "PRO",
  message = "Upgrade to Pro to access this feature"
) {
  if (plan !== required) {
    throw new AppError(message, 403, "PLAN_REQUIRED");
  }
}
