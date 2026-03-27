import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { ApiAuthResult, ApiTokenPayload } from "./types";
import { unauthorized, forbidden } from "./response";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Verifies the Bearer JWT from the Authorization header.
 * Returns ApiAuthResult on success, or a NextResponse (401) on failure.
 */
export async function authenticateApiToken(
  request: Request | { headers: { get(name: string): string | null } }
): Promise<ApiAuthResult | NextResponse> {
  const authHeader =
    "headers" in request && typeof request.headers.get === "function"
      ? request.headers.get("Authorization")
      : null;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized("MISSING_TOKEN", "Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify<ApiTokenPayload>(token, getSecret());
    return {
      userId: payload.sub,
      instanceId: payload.instance_id,
      scopes: payload.scopes ?? [],
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "JWTExpired") {
      return unauthorized("EXPIRED_TOKEN", "Token has expired");
    }
    return unauthorized("INVALID_TOKEN", "Invalid token");
  }
}

/**
 * Checks that the auth context contains the required scope.
 * Returns null if authorized, or a NextResponse (403) if not.
 */
export function requireScope(
  auth: ApiAuthResult,
  scope: string
): NextResponse | null {
  if (auth.scopes.includes("*") || auth.scopes.includes(scope)) {
    return null;
  }
  return forbidden(`Required scope: ${scope}`);
}
