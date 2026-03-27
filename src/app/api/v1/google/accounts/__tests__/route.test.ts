import { describe, it, expect, vi, beforeAll } from "vitest";
import { SignJWT } from "jose";

const SECRET = "test-jwt-secret-at-least-32-bytes-long";
const INSTANCE_ID = "inst-abc";
const USER_ID = "user-xyz";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

async function makeToken(scopes: string[]): Promise<string> {
  const secret = new TextEncoder().encode(SECRET);
  return new SignJWT({ instance_id: INSTANCE_ID, scopes })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(USER_ID)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

const FAKE_ACCOUNTS = [
  { id: "acct-1", google_email: "user@gmail.com", created_at: "2026-01-01T00:00:00Z" },
];

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: FAKE_ACCOUNTS, error: null }),
    })),
  })),
}));

describe("GET /api/v1/google/accounts", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/google/accounts");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 with insufficient scope", async () => {
    const { GET } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/google/accounts", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns google accounts list", async () => {
    const { GET } = await import("../route");
    const token = await makeToken(["google:read"]);
    const req = new Request("http://localhost/api/v1/google/accounts", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].email).toBe("user@gmail.com");
  });
});
