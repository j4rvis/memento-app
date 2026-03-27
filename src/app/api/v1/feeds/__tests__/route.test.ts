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

const FAKE_FEED = {
  id: "feed-1",
  title: "Example Feed",
  url: "https://example.com/feed.xml",
  site_url: "https://example.com",
  description: "A feed",
  last_fetched_at: null,
  created_at: "2026-01-01T00:00:00Z",
  unread_count: 5,
};

let mockSelect: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn((...args: unknown[]) => mockSelect(...args)),
      insert: vi.fn((...args: unknown[]) => mockInsert(...args)),
    })),
  })),
}));

vi.mock("@/modules/feeds/lib/feed-parser", () => ({
  parseFeed: vi.fn().mockResolvedValue({
    title: "Example Feed",
    description: "A feed",
    siteUrl: "https://example.com",
    entries: [],
  }),
}));

describe("GET /api/v1/feeds", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/feeds");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns feeds list", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      order: vi.fn().mockResolvedValue({ data: [FAKE_FEED], error: null }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["feeds:read"]);
    const req = new Request("http://localhost/api/v1/feeds", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Example Feed");
  });
});

describe("POST /api/v1/feeds", () => {
  it("returns 422 when url is missing", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 409 for duplicate feed URL", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: FAKE_FEED, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/feed.xml" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates feed from valid URL", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: FAKE_FEED, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["feeds:write"]);
    const req = new Request("http://localhost/api/v1/feeds", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/feed.xml" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe("Example Feed");
  });
});
