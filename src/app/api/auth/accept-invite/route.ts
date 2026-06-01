import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { acceptInviteSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const rl = await checkRateLimit(ip, "accept_invite");
  if (!rl.allowed) {
    logAudit("rate-limit-hit", { ip, meta: { action: "accept_invite" } });
    return NextResponse.json({ error: rl.reason }, { status: 429 });
  }

  const parsed = acceptInviteSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { token, name, password } = parsed.data;

  const invite = await prisma.userInvite.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invitation is invalid or has expired." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const email = invite.email.toLowerCase();

  // Create or upgrade the account to the invited role, then burn the invite.
  await prisma.$transaction([
    prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        passwordChangedAt: new Date(),
        role: invite.role,
        emailVerified: new Date(),
      },
      create: {
        email,
        name,
        passwordHash,
        passwordChangedAt: new Date(),
        role: invite.role,
        emailVerified: new Date(),
      },
    }),
    prisma.userInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logAudit("invite-accepted", { ip, meta: { email } });
  return NextResponse.json({ ok: true });
}
