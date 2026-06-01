import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = await checkRateLimit(ip, "reset_password");
  if (!rl.allowed) {
    logAudit("rate-limit-hit", { ip, meta: { action: "reset_password" } });
    return NextResponse.json({ error: rl.reason }, { status: 429 });
  }

  const parsed = resetPasswordSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  // Update the password and burn the token atomically. Bumping passwordChangedAt
  // invalidates any existing JWT sessions (see src/auth.ts).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logAudit("password-reset-completed", { ip, meta: { userId: record.userId } });
  return NextResponse.json({ ok: true });
}
