import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.appSetting.findFirst();
  if (!existing) {
    await prisma.appSetting.create({
      data: { allowGuestWrites: true, enabledAuthProviders: "" },
    });
    console.log("Seeded AppSetting defaults.");
  } else {
    console.log("AppSetting already present — nothing to seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
