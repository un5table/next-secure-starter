"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// Server actions re-check authorization — never trust that the page guard ran.
export async function clearAuditLog() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  await prisma.auditLog.deleteMany({});
  revalidatePath("/admin/security");
}
