import { createHmac, randomBytes } from "crypto";
import type { TokenResponse } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const SCOPE = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function buildState(userId: string, slug: string): string {
  const nonce = randomBytes(8).toString("hex");
  const payload = JSON.stringify({ userId, slug, nonce });
  const sig = createHmac("sha256", process.env.GOOGLE_TOKEN_SECRET!)
    .update(payload)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export function verifyState(state: string): { userId: string; slug: string } {
  const { payload, sig } = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  const expected = createHmac("sha256", process.env.GOOGLE_TOKEN_SECRET!)
    .update(payload)
    .digest("hex");
  if (sig !== expected) throw new Error("Invalid state parameter");
  return JSON.parse(payload);
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  const data = await res.json();
  return data.email as string;
}
