import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT, importHmac } from "jose";
import { authenticateApiToken, requireScope } from "../auth";

const SECRET = "test-secret-at-least-32-bytes-long-abc123";
const INSTANCE_ID = "inst-123";
const USER_ID = "user-456";
const SCOPES = ["todos:read", "todos:write"];

async function makeToken(
  overrides: {
    secret?: string;
    exp?: number;
    payload?: Record<string, unknown>;
  } = {}
): Promise<string> {
  const secret = new TextEncoder().encode(overrides.secret ?? SECRET);
  const payload = {
    sub: USER_ID,
    instance_id: INSTANCE_ID,
    scopes: SCOPES,
    ...overrides.payload,
  };
  let builder = new SignJWT(payload).setProtectedHeader({ alg: "HS256" });
  if (overrides.exp !== undefined) {
    builder = builder.setExpirationTime(overrides.exp);
  } else {
    builder = builder.setExpirationTime("24h");
  }
  return builder.setIssuedAt().sign(secret);
}

function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token !== undefined) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new Request("http://localhost/api/v1/todos", { headers });
}

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

describe("authenticateApiToken", () => {
  it("returns auth context for a valid JWT", async () => {
    const token = await makeToken();
    const req = makeRequest(token);
    const result = await authenticateApiToken(req);
    expect(result).toMatchObject({
      userId: USER_ID,
      instanceId: INSTANCE_ID,
      scopes: SCOPES,
    });
  });

  it("returns NextResponse 401 when Authorization header is missing", async () => {
    const req = makeRequest();
    const result = await authenticateApiToken(req);
    expect(result).toHaveProperty("status", 401);
    const body = await (result as Response).json();
    expect(body.error.code).toBe("MISSING_TOKEN");
  });

  it("returns NextResponse 401 when JWT has wrong signature", async () => {
    const token = await makeToken({ secret: "wrong-secret-at-least-32-bytes-x" });
    const req = makeRequest(token);
    const result = await authenticateApiToken(req);
    expect(result).toHaveProperty("status", 401);
    const body = await (result as Response).json();
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("returns NextResponse 401 when JWT is expired", async () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago
    const token = await makeToken({ exp: expiredAt });
    const req = makeRequest(token);
    const result = await authenticateApiToken(req);
    expect(result).toHaveProperty("status", 401);
    const body = await (result as Response).json();
    expect(body.error.code).toBe("EXPIRED_TOKEN");
  });
});

describe("requireScope", () => {
  it("passes when token has the required scope", () => {
    const auth = { userId: USER_ID, instanceId: INSTANCE_ID, scopes: ["todos:read"] };
    const result = requireScope(auth, "todos:read");
    expect(result).toBeNull();
  });

  it("passes when token has wildcard scope", () => {
    const auth = { userId: USER_ID, instanceId: INSTANCE_ID, scopes: ["*"] };
    const result = requireScope(auth, "todos:write");
    expect(result).toBeNull();
  });

  it("returns 403 response when scope is missing", async () => {
    const auth = { userId: USER_ID, instanceId: INSTANCE_ID, scopes: ["todos:read"] };
    const result = requireScope(auth, "todos:write");
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("status", 403);
    const body = await result!.json();
    expect(body.error.code).toBe("INSUFFICIENT_SCOPE");
  });
});
