# next-secure-starter

A production-grade, **security-first** Next.js 16 starter for Vercel. It bakes in the
hard parts most templates skip — auth done correctly, rate limiting, CSP, audit logging,
and a tested owned-resource pattern — so a new project starts from a defensible baseline
instead of a to-do list.

## What's included

- **Auth.js v5** — Google + GitHub OAuth (self-disable when creds are absent),
  email/password with **argon2id**, JWT sessions, role-based access, a dev login, and
  server-side session invalidation on password change (`passwordChangedAt`).
- **Prisma 7 + Neon** — pooled app connection, direct migration connection, generated
  client. Auth adapter models + `AppSetting`, `AuditLog`, invite/reset tokens.
- **Abuse protection** — Arcjet (WAF shield + bot detection + rate limiting) with an
  Upstash fallback, Cloudflare Turnstile verification, and an `allowGuestWrites`
  kill-switch on guest endpoints.
- **Security headers + CSP** — static headers in `next.config.ts`; a per-request CSP
  **nonce** in `src/proxy.ts`, shipping report-only with violations logged to `AuditLog`.
  Flip to enforcing with one env var. An ADMIN-only `/admin/security` page surfaces the
  audit log, event stats, and CSP mode.
- **Typed env + email** — build-time env validation (`@t3-oss/env-nextjs` + Zod) and
  branded transactional emails as React components (`src/emails/`, preview with
  `pnpm email`). Full password-reset and invite-acceptance flows are wired.
- **shadcn/ui** — Base UI primitives + Lucide, Tailwind v4, dark mode (next-themes),
  sonner toasts, accessible focus states.
- **Tested example** — a `Note` resource (`POST/GET /api/notes`, `GET/PATCH/DELETE
/api/notes/[id]`) demonstrating ownership via session **or** a hashed guest token,
  with Vitest unit tests and a Playwright smoke test.
- **Error monitoring** — Sentry (`@sentry/nextjs`) via instrumentation files +
  `withSentryConfig`; fully no-op without a DSN, CSP-aware, source-map upload opt-in.
  `GET /api/debug-sentry` to verify capture.
- **CI** — lint → audit → type-check → unit tests → build, with an opt-in Neon-branch
  E2E job.

## Quick start

```bash
pnpm install
cp .env.example .env.local        # fill in DATABASE_URL(_UNPOOLED), AUTH_SECRET, DEV_PASSWORD
pnpm db:generate                  # generate the Prisma client (required before dev/build)
pnpm exec prisma migrate dev --name init
pnpm db:seed                      # seed AppSetting defaults
pnpm dev
```

Locally, most integrations degrade gracefully: OAuth providers are hidden without
credentials, rate limiting is open without Upstash, email logs to the console without
Resend, and Turnstile is skipped without its secret. Sign in at `/sign-in` with any
email + your `DEV_PASSWORD` (the first account becomes ADMIN).

## Scripts

```bash
pnpm dev            # dev server
pnpm build          # prisma generate && next build
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright (needs a running app)
pnpm db:migrate     # prisma migrate dev
pnpm db:seed        # seed AppSetting
pnpm db:studio      # Prisma Studio
```

## Make it yours

1. Rebrand via `NEXT_PUBLIC_APP_NAME` / `_APP_URL` / `_BRAND_COLOR` and `src/lib/site.ts`.
2. Replace the `Note` model and its routes with your domain — **keep the spine** and copy
   the guard pattern in `POST /api/notes` for any new guest-writable endpoint.
3. Add UI with `pnpm dlx shadcn@latest add <component>`.

## Project rules

See **AGENTS.md** for the canonical engineering rules (auth in handlers, guest-endpoint
guards, schema discipline, testing). `CLAUDE.md` and `.windsurfrules` point to it.

## Deploy

Import the repo into Vercel, add the **Neon** and **Upstash** Marketplace integrations
(they auto-provision `DATABASE_URL` / `KV_REST_API_*`), set `AUTH_SECRET`, `AUTH_URL`,
`CRON_SECRET`, and any OAuth/Resend/Turnstile keys, then deploy. The audit-cleanup cron
is configured in `vercel.ts` (typed config via `@vercel/config`).
