// Creates a UserInvite and prints the acceptance URL (for testing the invite flow).
// Usage (PowerShell):
//   pnpm tsx --env-file=.env.local scripts/create-invite.ts you@example.com ADMIN
import { PrismaClient } from "../src/generated/prisma/client";
import { createDbAdapter } from "../src/lib/db-adapter";
import { randomBytes, createHash } from "crypto";

const adapter = createDbAdapter(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] ?? "USER").toUpperCase() as "USER" | "ADMIN";
  if (!email) {
    console.error(
      "Usage: pnpm tsx --env-file=.env.local scripts/create-invite.ts <email> [USER|ADMIN]",
    );
    process.exit(1);
  }

  // Invites need a creator. Use an existing admin, else any user.
  const creator =
    (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ??
    (await prisma.user.findFirst());
  if (!creator) {
    console.error(
      "No users exist yet. Create an admin first (scripts/create-admin.ts).",
    );
    process.exit(1);
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.userInvite.create({
    data: {
      email,
      role,
      tokenHash,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdById: creator.id,
    },
  });

  const base =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  console.log(`Invite created for ${email} (${role}):`);
  console.log(`${base}/invite/${token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
