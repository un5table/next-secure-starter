import type { VercelConfig } from "@vercel/config/v1";

// Typed project configuration (replaces vercel.json). Vercel reads this at build
// time; it takes precedence over vercel.json if both exist.
//
// Security headers live in next.config.ts so they also apply to `next dev`/`next start`
// and stay portable off Vercel. Add platform-only concerns (rewrites, redirects,
// cache-control) here with the `routes` helpers from "@vercel/config/v1" if needed.
export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/cleanup-audit",
      schedule: "0 2 * * *",
    },
  ],
};
