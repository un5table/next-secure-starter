import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";

// Daily cron (see vercel.json) — prunes AuditLog rows older than 30 days and
// expired one-time tokens. Secured by CRON_SECRET (Vercel sets the Authorization
// header on cron invocations).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (env.CRON_SECRET && auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [audits, resets, invites] = await Promise.all([
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.userInvite.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  return NextResponse.json({
    deletedAuditLogs: audits.count,
    deletedExpiredResets: resets.count,
    deletedExpiredInvites: invites.count,
  });
}
