import "dotenv/config";
import { defineConfig } from "prisma/config";

// Pooled URL for the app; direct (unpooled) URL for migrations.
// The Neon Vercel integration provisions DATABASE_URL (pooled) and
// DATABASE_URL_UNPOOLED (direct) automatically.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    // directUrl bypasses the pooler for migrations; Prisma 7 types omit it but it works at runtime.
    // @ts-expect-error directUrl not yet in defineConfig typings
    directUrl: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
