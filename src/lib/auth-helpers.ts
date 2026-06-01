import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import type { Role } from "@/generated/prisma/enums";

// Re-exported for convenience; defined in tokens.ts so they stay dependency-free.
export { generateToken, hashToken } from "@/lib/tokens";

// ── Session helpers ───────────────────────────────────────────────

/** Returns the current session or null. Safe to call from API route handlers. */
export async function getSession() {
  return auth();
}

/**
 * Asserts the caller is authenticated. Redirects to /sign-in if not.
 * Use in Server Components and page files only — not in API route handlers.
 */
export async function requireSession() {
  const session = await auth();
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * Asserts the caller has at least the given role. Throws a 403 Response otherwise.
 * Pass the user id (from getSession) plus the required role.
 */
export async function requireRole(userId: string, required: Role) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const roleOrder: Role[] = ["USER", "ADMIN"];
  const userLevel = roleOrder.indexOf(user?.role ?? "USER");
  const requiredLevel = roleOrder.indexOf(required);

  if (userLevel < requiredLevel) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ── Ownership helpers ─────────────────────────────────────────────
//
// This is the canonical pattern for an owned resource: ownership is proven by
// EITHER an authenticated session matching ownerId, OR a guest manage-token
// whose SHA-256 hash matches the stored ownerTokenHash. Copy this shape for
// each of your owned models.

/**
 * Checks whether the caller owns the note: via authenticated session or a valid
 * guest manage-token. Returns the note on success, or null if not found / not authorized.
 */
export async function requireNoteOwner(
  noteId: string,
  manageToken?: string | null,
): Promise<{ id: string; ownerId: string | null } | null> {
  const session = await auth();

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, ownerId: true, ownerTokenHash: true },
  });
  if (!note) return null;

  if (session?.user?.id && note.ownerId === session.user.id) {
    return { id: note.id, ownerId: note.ownerId };
  }

  if (manageToken && note.ownerTokenHash && hashToken(manageToken) === note.ownerTokenHash) {
    return { id: note.id, ownerId: note.ownerId };
  }

  return null;
}
