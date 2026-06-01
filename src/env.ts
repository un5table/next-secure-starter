import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, type-safe environment access. Importing `env` (directly or via
 * next.config.ts) validates the whole environment at build/startup, so missing or
 * malformed vars fail fast instead of surfacing as runtime errors. Import `env`
 * everywhere instead of reaching for `process.env`.
 *
 * Set SKIP_ENV_VALIDATION=1 to bypass (e.g. Docker image builds, linting).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Database (Neon). Pooled for the app, direct for migrations.
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url().optional(),

    // Auth.js
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),

    // OAuth (optional — each provider self-disables when absent).
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Rate limiting (Upstash / Vercel KV).
    KV_REST_API_URL: z.string().url().optional(),
    KV_REST_API_TOKEN: z.string().optional(),

    // Abuse protection (Arcjet). Optional — falls back to Upstash when unset.
    ARCJET_KEY: z.string().optional(),

    // Turnstile, email, cron.
    TURNSTILE_SECRET_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().optional(),
    CRON_SECRET: z.string().optional(),

    // Security.
    CSP_MODE: z.enum(["enforcing", "report-only"]).optional(),

    // Dev-only credentials login.
    DEV_PASSWORD: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_BRAND_COLOR: z.string().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },
  // Client/public vars must be destructured explicitly — Next.js inlines them.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BRAND_COLOR: process.env.NEXT_PUBLIC_BRAND_COLOR,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  // Treat "" the same as unset, so blank .env entries fall back to defaults.
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
