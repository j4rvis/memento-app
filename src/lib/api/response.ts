import { NextResponse } from "next/server";
import type { ApiSuccessResponse, ApiErrorResponse } from "./types";

function json<T>(body: T, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

export function ok<T>(data: T, meta?: { total: number }): NextResponse {
  const body: ApiSuccessResponse<T> = meta ? { data, meta } : { data };
  return json(body, 200);
}

export function created<T>(data: T): NextResponse {
  const body: ApiSuccessResponse<T> = { data };
  return json(body, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function error(code: string, message: string, status: number): NextResponse {
  const body: ApiErrorResponse = { error: { code, message } };
  return json(body, status);
}

export function notFound(message = "Not found"): NextResponse {
  return error("NOT_FOUND", message, 404);
}

export function forbidden(message = "Insufficient scope"): NextResponse {
  return error("INSUFFICIENT_SCOPE", message, 403);
}

export function unauthorized(
  code = "UNAUTHORIZED",
  message = "Unauthorized"
): NextResponse {
  return error(code, message, 401);
}

export function conflict(message = "Conflict"): NextResponse {
  return error("CONFLICT", message, 409);
}

export function unprocessable(message = "Validation error"): NextResponse {
  return error("VALIDATION_ERROR", message, 422);
}

export function badRequest(message = "Bad request"): NextResponse {
  return error("VALIDATION_ERROR", message, 400);
}
