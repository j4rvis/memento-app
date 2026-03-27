import { describe, it, expect, vi, beforeAll } from "vitest";
import { createHash } from "crypto";

// Set env before importing route
beforeAll(() => {
  process.env.JWT_SECRET = "test-jwt-secret-at-least-32-bytes-long";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

const RAW_SECRET = "a".repeat(64);
const SECRET_HASH = createHash("sha256").update(RAW_SECRET).digest("hex");

const ACTIVE_CLIENT = {
  id: "uuid-1",
  client_id: "mc_test123",
  client_secret_hash: SECRET_HASH,
  instance_id: "inst-abc",
  user_id: "user-xyz",
  scopes: ["todos:read", "todos:write"],
  is_active: true,
};

const REVOKED_CLIENT = { ...ACTIVE_CLIENT, client_id: "mc_revoked", is_active: false };

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    })),
  })),
}));

// Dynamic mock helper — replaced per test
let mockSingle: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  })),
}));

async function postToken(body: unknown): Promise<Response> {
  const { POST } = await import("../route");
  const req = new Request("http://localhost/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/auth/token", () => {
  it("returns JWT for valid credentials", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: ACTIVE_CLIENT, error: null });
    const res = await postToken({ client_id: "mc_test123", client_secret: RAW_SECRET });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      access_token: expect.any(String),
      token_type: "Bearer",
      expires_in: 86400,
    });
  });

  it("returns 401 for wrong client_secret", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: ACTIVE_CLIENT, error: null });
    const res = await postToken({ client_id: "mc_test123", client_secret: "wrong" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for unknown client_id", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    const res = await postToken({ client_id: "mc_unknown", client_secret: RAW_SECRET });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for revoked client", async () => {
    mockSingle = vi.fn().mockResolvedValue({ data: REVOKED_CLIENT, error: null });
    const res = await postToken({ client_id: "mc_revoked", client_secret: RAW_SECRET });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 400 when client_id is missing", async () => {
    mockSingle = vi.fn();
    const res = await postToken({ client_secret: RAW_SECRET });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when client_secret is missing", async () => {
    mockSingle = vi.fn();
    const res = await postToken({ client_id: "mc_test123" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
