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
  excerpt: "An example site",
  author: null,
  site_name: "Example",
  content_type: "article",
  is_read: false,
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
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

vi.mock("@/modules/articles/lib/scraper", () => ({
  scrapeMetaTags: vi.fn().mockResolvedValue({
    title: "Scraped Title",
    description: "Scraped description",
    imageUrl: null,
    siteName: "Example",
  }),
}));

describe("GET /api/v1/bookmarks", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/bookmarks");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns bookmarks list", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [FAKE_BOOKMARK], error: null, count: 1 }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["bookmarks:read"]);
    const req = new Request("http://localhost/api/v1/bookmarks", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

describe("POST /api/v1/bookmarks", () => {
  it("returns 422 when url is missing", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 for duplicate URL", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: FAKE_BOOKMARK, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates bookmark with URL-only (scrapes meta)", async () => {
    // First call: duplicate check returns null
    let selectCallCount = 0;
    mockSelect = vi.fn().mockImplementation(() => {
      selectCallCount++;
      return {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
    const newBm = { ...FAKE_BOOKMARK, title: "Scraped Title" };
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newBm, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe("Scraped Title");
  });

  it("creates bookmark with full body (no scraping)", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const fullBm = { ...FAKE_BOOKMARK, title: "My Title" };
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fullBm, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["bookmarks:write"]);
    const req = new Request("http://localhost/api/v1/bookmarks", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        title: "My Title",
        content: "...",
        excerpt: "Some excerpt",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe("My Title");
  });
});
