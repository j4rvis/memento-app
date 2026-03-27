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

const FAKE_BOOKMARK = {
  id: "bm-1",
  url: "https://example.com",
  title: "Example",
  excerpt: null,
  author: null,
  site_name: null,
  content_type: "article",
  is_read: false,
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
};

let mockSingle: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  })),
}));

function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe("GET /api/v1/bookmarks/:id", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/bookmarks/bm-1");
    const res = await GET(req, { params: makeParams("bm-1") });
    expect(res.status).toBe(401);
  });

  it("returns bookmark for valid request", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_BOOKMARK, error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["bookmarks:read"]);
    const req = new Request("http://localhost/api/v1/bookmarks/bm-1", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("bm-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.url).toBe("https://example.com");
  });

  it("returns 404 for unknown bookmark", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { GET } = await import("../route");
    const token = await makeToken(["bookmarks:read"]);
    const req = new Request("http://localhost/api/v1/bookmarks/unknown", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("unknown") });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/bookmarks/:id", () => {
  it("returns 204 for existing bookmark", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_BOOKMARK, error: null });
    const { DELETE } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks/bm-1", {
      method: "DELETE",
      headers: authHeader(token),
    });
    const res = await DELETE(req, { params: makeParams("bm-1") });
    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown bookmark", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { DELETE } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks/unknown", {
      method: "DELETE",
      headers: authHeader(token),
    });
    const res = await DELETE(req, { params: makeParams("unknown") });
    expect(res.status).toBe(404);
  });
});
