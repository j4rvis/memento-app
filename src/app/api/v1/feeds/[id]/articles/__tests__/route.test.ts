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

const FAKE_FEED = { id: "feed-1", instance_id: INSTANCE_ID };
const FAKE_ENTRY = {
  id: "entry-1",
  title: "Article 1",
  url: "https://example.com/1",
  summary: "Summary",
  author: null,
  published_at: null,
  is_read: false,
  is_starred: false,
  created_at: "2026-01-01T00:00:00Z",
};

let mockFeedSingle: ReturnType<typeof vi.fn>;
let mockEntriesQuery: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "feeds") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: (...args: unknown[]) => mockFeedSingle(...args),
        };
      }
      return {
        select: vi.fn((...args: unknown[]) => mockEntriesQuery(...args)),
      };
    }),
  })),
}));

function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe("GET /api/v1/feeds/:id/articles", () => {
  it("returns 404 for unknown feed", async () => {
    mockFeedSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds/unknown/articles", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("unknown") });
    expect(res.status).toBe(404);
  });

  it("returns articles for known feed", async () => {
    mockFeedSingle = vi.fn().mockResolvedValue({ data: FAKE_FEED, error: null });
    mockEntriesQuery = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [FAKE_ENTRY], error: null }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("feed-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Article 1");
  });

  it("filters by is_read=false", async () => {
    mockFeedSingle = vi.fn().mockResolvedValue({ data: FAKE_FEED, error: null });
    const eqMock = vi.fn().mockReturnThis();
    mockEntriesQuery = vi.fn().mockReturnValue({
      eq: eqMock,
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds/feed-1/articles?is_read=false", {
      headers: authHeader(token),
    });
    await GET(req, { params: makeParams("feed-1") });
    // is_read filter should have been called
    expect(eqMock).toHaveBeenCalledWith("is_read", false);
  });
});
