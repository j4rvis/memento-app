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

const FAKE_TODOS = [
  {
    id: "todo-1",
    title: "Buy milk",
    description: null,
    is_completed: false,
    priority: 0,
    due_date: null,
    project_id: null,
    instance_id: INSTANCE_ID,
    user_id: USER_ID,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

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

describe("GET /api/v1/todos", () => {
  it("returns 401 without Authorization header", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/todos");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 with insufficient scope", async () => {
    const { GET } = await import("../route");
    const token = await makeToken(["bookmarks:read"]);
    const req = new Request("http://localhost/api/v1/todos", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns todos list for authenticated request", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: FAKE_TODOS, error: null, count: 1 }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/todos", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Buy milk");
    expect(body.meta.total).toBe(1);
  });

  it("returns todos with wildcard scope", async () => {
    mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: FAKE_TODOS, error: null, count: 1 }),
    });
    const { GET } = await import("../route");
    const token = await makeToken(["*"]);
    const req = new Request("http://localhost/api/v1/todos", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/todos", () => {
  it("returns 401 without auth", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/v1/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 with wrong scope", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/todos", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 422 when title is missing", async () => {
    const { POST } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates a todo and returns 201", async () => {
    const newTodo = { ...FAKE_TODOS[0], id: "todo-new", title: "New todo" };
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newTodo, error: null }),
    });
    const { POST } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos", {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New todo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe("New todo");
  });
});
