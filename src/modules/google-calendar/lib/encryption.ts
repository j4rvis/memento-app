import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";

function getKey(): Buffer {
  const secret = process.env.GOOGLE_TOKEN_SECRET;
  if (!secret) throw new Error("GOOGLE_TOKEN_SECRET env var is not set");
  // Derive a 32-byte key from the secret via SHA-256
  const { createHash } = require("crypto");
  return createHash("sha256").update(secret).digest();
}

/** Encrypts a plaintext string. Returns "iv:authTag:ciphertext" as hex. */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypts a token previously encrypted with encryptToken. */
export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** Signs a payload string with HMAC-SHA256. Returns "payload.signature" as hex. */
export function signState(payload: string): string {
  const secret = process.env.GOOGLE_TOKEN_SECRET;
  if (!secret) throw new Error("GOOGLE_TOKEN_SECRET env var is not set");
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Verifies and returns the payload, or throws if invalid. */
export function verifyState(state: string): string {
  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) throw new Error("Invalid state");
  const payload = state.slice(0, lastDot);
  const expected = signState(payload);
  if (state !== expected) throw new Error("State signature invalid");
  return payload;
}
