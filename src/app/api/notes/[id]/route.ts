import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireNoteOwner } from "@/lib/auth-helpers";
import { updateNoteSchema } from "@/lib/schemas";

const noteSelect = {
  id: true,
  title: true,
  body: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Ctx = { params: Promise<{ id: string }> };

// Public read.
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id }, select: noteSelect });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}

// Owner-only update. Guests pass ?token=<manageToken>; authed users are matched by id.
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const manageToken = new URL(request.url).searchParams.get("token");

  const ownership = await requireNoteOwner(id, manageToken);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = updateNoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const note = await prisma.note.update({
    where: { id },
    data: parsed.data,
    select: noteSelect,
  });
  return NextResponse.json({ note });
}

// Owner-only delete.
export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  const manageToken = new URL(request.url).searchParams.get("token");

  const ownership = await requireNoteOwner(id, manageToken);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.note.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
