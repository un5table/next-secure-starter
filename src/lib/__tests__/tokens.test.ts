import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "@/lib/tokens";

describe("tokens", () => {
  it("generates unique, URL-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
    // base64url alphabet only — safe to put in a URL without encoding.
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 random bytes -> 43 base64url chars.
    expect(a.length).toBeGreaterThanOrEqual(43);
  });

  it("hashes deterministically and never returns the raw token", () => {
    const token = generateToken();
    expect(hashToken(token)).toEqual(hashToken(token));
    expect(hashToken(token)).not.toEqual(token);
    // SHA-256 hex is 64 chars.
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });
});
