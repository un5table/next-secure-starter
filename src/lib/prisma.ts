import { PrismaClient } from "../generated/prisma/client";
import { createDbAdapter } from "@/lib/db-adapter";
import { env } from "@/env";

function createPrismaClient() {
  return new PrismaClient({
    adapter: createDbAdapter(env.DATABASE_URL),
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
