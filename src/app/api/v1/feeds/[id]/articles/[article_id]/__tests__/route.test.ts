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

const FAKE_ENTRY = {
  id: "entry-1",
  title: "Article 1",
  url: "https://example.com/1",
  summary: null,
  author: null,
  published_at: null,
  is_read: false,
  is_starred: false,
  feed_id: "feed-1",
  created_at: "2026-01-01T00:00:00Z",
};

let mockSingle: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  })),
}));

function makeParams(id: string, article_id: string) {
  return Promise.resolve({ id, article_id });
}

describe("GET /api/v1/feeds/:id/articles/:article_id", () => {
  it("returns article for valid request", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_ENTRY, error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles/entry-1", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("feed-1", "entry-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("entry-1");
  });

  it("returns 404 for unknown article", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles/unknown", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("feed-1", "unknown") });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/feeds/:id/articles/:article_id", () => {
  it("marks article as read", async () => {
    const updated = { ...FAKE_ENTRY, is_read: true };
    mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null });
    const { PATCH } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles/entry-1", {
      method: "PATCH",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
    const res = await PATCH(req, { params: makeParams("feed-1", "entry-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.is_read).toBe(true);
  });

  it("returns 422 for empty patch body", async () => {
    const { PATCH } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles/entry-1", {
      method: "PATCH",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: makeParams("feed-1", "entry-1") });
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/v1/feeds/:id/articles/:article_id", () => {
  it("returns 204 for existing article", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_ENTRY, error: null });
    const { DELETE } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles/entry-1", {
      method: "DELETE",
      headers: authHeader(token),
    });
    const res = await DELETE(req, { params: makeParams("feed-1", "entry-1") });
    expect(res.status).toBe(204);
  });
});
