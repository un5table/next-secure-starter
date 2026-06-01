// Bootstraps an ADMIN user with local credentials.
// Usage (PowerShell):
//   $env:ADMIN_PW="..."; pnpm tsx --env-file=.env.local scripts/create-admin.ts you@example.com
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import argon2 from "argon2";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const password = process.env.ADMIN_PW;
  if (!email || !password) {
    console.error(
      "Usage: ADMIN_PW=... pnpm tsx --env-file=.env.local scripts/create-admin.ts <email>",
    );
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash, passwordChangedAt: new Date() },
    create: {
      email,
      name: email.split("@")[0],
      role: "ADMIN",
      passwordHash,
      passwordChangedAt: new Date(),
      emailVerified: new Date(),
    },
  });

  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
