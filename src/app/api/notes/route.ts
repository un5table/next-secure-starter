import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { generateToken, hashToken } from "@/lib/tokens";
import { getClientIp } from "@/lib/rate-limit";
import { protectRequest } from "@/lib/arcjet";
import { verifyTurnstile } from "@/lib/turnstile";
import { logAudit } from "@/lib/audit";
import { createNoteSchema } from "@/lib/schemas";

// Example owned-resource creation. Demonstrates the full guest-endpoint guard:
// rate limit -> validation -> kill-switch + CAPTCHA (guests) -> token issuance.
export async function POST(request: Request) {
  const session = await getSession();
  const ip = getClientIp(request);

  // Shield + bot detection + rate limit (Arcjet), or Upstash rate limit as fallback.
  const protection = await protectRequest(request, {
    fallbackAction: "create_resource",
  });
  if (!protection.ok) {
    logAudit("rate-limit-hit", {
      ip,
      meta: { action: "create_resource", reason: protection.reason },
    });
    return NextResponse.json(
      { error: protection.reason },
      {
        status: protection.status,
      },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { title, body, turnstileToken } = parsed.data;

  // Guest path: honor the kill-switch and require a valid Turnstile token.
  let manageToken: string | undefined;
  let ownerTokenHash: string | null = null;
  if (!session?.user) {
    const settings = await prisma.appSetting.findFirst({
      select: { allowGuestWrites: true },
    });
    if (settings && !settings.allowGuestWrites) {
      return NextResponse.json(
        { error: "Guest writes are disabled" },
        { status: 403 },
      );
    }
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 400 },
      );
    }
    // Guests prove ownership later with this raw token — returned exactly once.
    manageToken = generateToken();
    ownerTokenHash = hashToken(manageToken);
  }

  const note = await prisma.note.create({
    data: {
      title,
      body: body ?? null,
      ownerId: session?.user?.id ?? null,
      ownerTokenHash,
    },
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return NextResponse.json({ note, manageToken }, { status: 201 });
}

// Lists the authenticated user's own notes.
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ notes: [] });

  const notes = await prisma.note.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, createdAt: true },
  });
  return NextResponse.json({ notes });
}
