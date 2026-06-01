import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { forgotPasswordSchema } from "@/lib/schemas";
import { site } from "@/lib/site";
import { env } from "@/env";

const RESET_TTL_MIN = 15;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = await checkRateLimit(ip, "forgot_password");
  if (!rl.allowed) {
    logAudit("rate-limit-hit", { ip, meta: { action: "forgot_password" } });
    return NextResponse.json({ error: rl.reason }, { status: 429 });
  }

  const parsed = forgotPasswordSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Only act if the account exists, but ALWAYS return 200 — never reveal whether
  // an email is registered (prevents account enumeration).
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000),
      },
    });
    const base = env.AUTH_URL ?? site.url;
    await sendPasswordResetEmail(
      email,
      `${base}/reset-password?token=${token}`,
    );
    logAudit("password-reset-requested", { ip, meta: { email } });
  }

  return NextResponse.json({ ok: true });
}
