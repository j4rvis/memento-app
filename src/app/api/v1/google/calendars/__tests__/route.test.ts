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
  { id: "acct-1", google_email: "user@gmail.com" },
];
const FAKE_CALENDARS = [
  { google_account_id: "acct-1", google_calendar_id: "primary", name: "Work", color: "#4285F4" },
];

let mockAccountOrder: ReturnType<typeof vi.fn>;
let mockCalendarData: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "google_accounts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: (...args: unknown[]) => mockAccountOrder(...args),
        };
      }
      // google_calendars
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: (...args: unknown[]) => mockCalendarData(...args),
      };
    }),
  })),
}));

describe("GET /api/v1/google/calendars", () => {
  it("returns calendars grouped by account", async () => {
    mockAccountOrder = vi.fn().mockResolvedValue({ data: FAKE_ACCOUNTS, error: null });
    mockCalendarData = vi.fn().mockResolvedValue({ data: FAKE_CALENDARS, error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["google:read"]);
    const req = new Request("http://localhost/api/v1/google/calendars", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].account_id).toBe("acct-1");
    expect(body.data[0].calendars).toHaveLength(1);
    expect(body.data[0].calendars[0].name).toBe("Work");
  });

  it("filters by account_id query param", async () => {
    mockAccountOrder = vi.fn().mockResolvedValue({ data: FAKE_ACCOUNTS, error: null });
    mockCalendarData = vi.fn().mockResolvedValue({ data: FAKE_CALENDARS, error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["google:read"]);
    const req = new Request("http://localhost/api/v1/google/calendars?account_id=acct-1", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("returns empty list for unknown account_id", async () => {
    mockAccountOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCalendarData = vi.fn().mockResolvedValue({ data: [], error: null });
    const { GET } = await import("../route");
    const token = await makeToken(["google:read"]);
    const req = new Request("http://localhost/api/v1/google/calendars?account_id=unknown", {
      headers: authHeader(token),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });
});
