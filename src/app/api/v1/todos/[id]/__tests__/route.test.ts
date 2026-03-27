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

const FAKE_TODO = {
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
};

let mockSingle: ReturnType<typeof vi.fn>;
let mockDelete: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn((...args: unknown[]) => mockDelete(...args)),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  })),
}));

function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe("GET /api/v1/todos/:id", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/v1/todos/todo-1");
    const res = await GET(req, { params: makeParams("todo-1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown todo", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { GET } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/todos/todo-unknown", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("todo-unknown") });
    expect(res.status).toBe(404);
  });

  it("returns todo for valid request", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_TODO, error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["todos:read"]);
    const req = new Request("http://localhost/api/v1/todos/todo-1", {
      headers: authHeader(token),
    });
    const res = await GET(req, { params: makeParams("todo-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Buy milk");
  });
});

describe("PUT /api/v1/todos/:id", () => {
  it("returns 404 for unknown todo", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { PUT } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos/todo-unknown", {
      method: "PUT",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: true }),
    });
    const res = await PUT(req, { params: makeParams("todo-unknown") });
    expect(res.status).toBe(404);
  });

  it("updates a todo and returns 200", async () => {
    const updated = { ...FAKE_TODO, is_completed: true };
    mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null });
    const { PUT } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos/todo-1", {
      method: "PUT",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: true }),
    });
    const res = await PUT(req, { params: makeParams("todo-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.is_completed).toBe(true);
  });
});

describe("DELETE /api/v1/todos/:id", () => {
  it("returns 204 for existing todo", async () => {
    mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: FAKE_TODO, error: null }),
    });
    // First select must find the todo
    mockSingle = vi.fn().mockResolvedValue({ data: FAKE_TODO, error: null });
    const { DELETE } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos/todo-1", {
      method: "DELETE",
      headers: authHeader(token),
    });
    const res = await DELETE(req, { params: makeParams("todo-1") });
    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown todo", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const { DELETE } = await import("../route");
    const token = await makeToken(["todos:write"]);
    const req = new Request("http://localhost/api/v1/todos/todo-unknown", {
      method: "DELETE",
      headers: authHeader(token),
    });
    const res = await DELETE(req, { params: makeParams("todo-unknown") });
    expect(res.status).toBe(404);
  });
});
