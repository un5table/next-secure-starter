import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the spine so the route runs without a DB, Redis, or network.
// vi.hoisted lets these be referenced inside the hoisted vi.mock factories.
const {
  auth,
  noteCreate,
  appSettingFindFirst,
  protectRequest,
  verifyTurnstile,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  noteCreate: vi.fn(),
  appSettingFindFirst: vi.fn(),
  protectRequest: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { create: noteCreate },
    appSetting: { findFirst: appSettingFindFirst },
  },
}));
vi.mock("@/lib/arcjet", () => ({ protectRequest }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "1.2.3.4" }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

import { POST } from "../route";

function req(body: unknown) {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue(null);
  protectRequest.mockResolvedValue({ ok: true });
  verifyTurnstile.mockResolvedValue(true);
  appSettingFindFirst.mockResolvedValue({ allowGuestWrites: true });
  noteCreate.mockResolvedValue({
    id: "note_1",
    title: "Hi",
    body: null,
    createdAt: new Date(),
  });
});

describe("POST /api/notes", () => {
  it("returns the protection status when blocked (rate limit / bot / shield)", async () => {
    protectRequest.mockResolvedValue({
      ok: false,
      status: 429,
      reason: "slow down",
    });
    const res = await POST(req({ title: "Hi" }));
    expect(res.status).toBe(429);
    expect(noteCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid input", async () => {
    const res = await POST(req({ title: "" }));
    expect(res.status).toBe(400);
    expect(noteCreate).not.toHaveBeenCalled();
  });

  it("blocks guests when the kill-switch is off", async () => {
    appSettingFindFirst.mockResolvedValue({ allowGuestWrites: false });
    const res = await POST(req({ title: "Hi" }));
    expect(res.status).toBe(403);
  });

  it("rejects guests with a failed CAPTCHA", async () => {
    verifyTurnstile.mockResolvedValue(false);
    const res = await POST(req({ title: "Hi" }));
    expect(res.status).toBe(400);
  });

  it("creates a guest note and returns a one-time manage token", async () => {
    const res = await POST(req({ title: "Hi" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.manageToken).toBeTruthy();
    // Guest note stores a hashed token and no ownerId.
    const data = noteCreate.mock.calls[0][0].data;
    expect(data.ownerId).toBeNull();
    expect(data.ownerTokenHash).toBeTruthy();
    expect(data.ownerTokenHash).not.toEqual(json.manageToken);
  });

  it("creates an owned note for an authenticated user with no token", async () => {
    auth.mockResolvedValue({ user: { id: "user_1", role: "USER" } });
    const res = await POST(req({ title: "Hi" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.manageToken).toBeUndefined();
    const data = noteCreate.mock.calls[0][0].data;
    expect(data.ownerId).toBe("user_1");
    expect(data.ownerTokenHash).toBeNull();
    // Authenticated creation must not consult the guest kill-switch or CAPTCHA.
    expect(appSettingFindFirst).not.toHaveBeenCalled();
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });
});
