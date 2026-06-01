import { createHash, randomBytes } from "crypto";

// Pure token utilities — no DB or session imports, so they're cheap to unit test.

/** Generates a 256-bit random token encoded as base64url. Return to the caller once. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hash of a token — this is what we store in the DB, never the raw token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
