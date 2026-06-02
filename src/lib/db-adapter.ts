import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Build the Prisma driver adapter for a connection string so the app runs on any
 * Postgres host. Neon's serverless driver speaks a custom protocol that only Neon
 * endpoints understand, so we use it for `*.neon.tech` URLs and fall back to
 * node-postgres (`pg`) for everything else — local Docker, Supabase, RDS, Railway…
 *
 * Kept free of `@/env` / Next.js so the standalone scripts and the Prisma seed
 * (run via plain `tsx`) can share the exact same host-agnostic selection.
 */
export function createDbAdapter(connectionString: string) {
  if (/\.neon\.tech([:/]|$)/i.test(connectionString)) {
    return new PrismaNeon({ connectionString });
  }
  return new PrismaPg({ connectionString });
}
