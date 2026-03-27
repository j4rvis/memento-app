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

const FAKE_TEMPLATE = {
  id: "tmpl-1",
  config: { pages: [], theme: "classic" },
};

let mockSingle: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  })),
}));

vi.mock("@/modules/newspaper/lib/resolve-config", () => ({
  resolveConfig: vi.fn().mockImplementation((config) => Promise.resolve(config)),
}));

vi.mock("@/modules/newspaper/engine", () => ({
  render: vi.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

describe("POST /api/v1/newspaper/generate", () => {
  it("returns 401 without auth", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "tmpl-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 with insufficient scope", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "tmpl-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 422 when neither template_id nor config is provided", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["newspaper:write"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toMatch(/template_id or config/);
  });

  it("returns 404 for unknown template_id", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { POST } = await import("../route");
    const token = await makeToken(["newspaper:write"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "unknown" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns PDF for valid template_id", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_TEMPLATE, error: null });
    const { POST } = await import("../route");
    const token = await makeToken(["newspaper:write"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "tmpl-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("returns JSON metadata when format=json", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_TEMPLATE, error: null });
    const { POST } = await import("../route");
    const token = await makeToken(["newspaper:write"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate?format=json", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "tmpl-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      generated_at: expect.any(String),
      size_bytes: expect.any(Number),
    });
  });

  it("generates PDF from inline config", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["newspaper:write"]);
    const req = new Request("http://localhost/api/v1/newspaper/generate", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ config: { pages: [], theme: "classic" } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });
});
