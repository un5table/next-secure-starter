import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  resetFindUnique,
  resetUpdate,
  userUpdate,
  transaction,
  checkRateLimit,
  hashPassword,
} = vi.hoisted(() => ({
  resetFindUnique: vi.fn(),
  resetUpdate: vi.fn(),
  userUpdate: vi.fn(),
  transaction: vi.fn(),
  checkRateLimit: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findUnique: resetFindUnique, update: resetUpdate },
    user: { update: userUpdate },
    $transaction: transaction,
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit,
  getClientIp: () => "1.2.3.4",
}));
vi.mock("@/lib/password", () => ({ hashPassword }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

import { POST } from "../route";

function req(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = { token: "raw-token", password: "longenoughpw" };

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockResolvedValue({ allowed: true });
  hashPassword.mockResolvedValue("argon2-hash");
  transaction.mockResolvedValue([]);
});

describe("POST /api/auth/reset-password", () => {
  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, reason: "slow down" });
    const res = await POST(req(valid));
    expect(res.status).toBe(429);
    expect(resetFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 on a short password", async () => {
    const res = await POST(req({ token: "x", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown token", async () => {
    resetFindUnique.mockResolvedValue(null);
    const res = await POST(req(valid));
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    resetFindUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await POST(req(valid));
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an already-used token", async () => {
    resetFindUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const res = await POST(req(valid));
    expect(res.status).toBe(400);
  });

  it("resets the password and burns the token on a valid request", async () => {
    resetFindUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    expect(hashPassword).toHaveBeenCalledWith(valid.password);
    expect(transaction).toHaveBeenCalledOnce();
  });
});
