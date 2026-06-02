# Handoff Log

> **Living document.** Whichever tool is working (Claude Code or Windsurf) updates this
> BEFORE ending a session. Keep it SHORT and CURRENT — overwrite stale lines. Git history
> is the permanent record; this answers "where are we now and what's next?"

_Last updated: bootstrap — generated from next-secure-starter._

## Current state

Fresh starter. The security/auth spine is in place and the build is green:

- Auth.js v5 (Google + GitHub OAuth that self-disable without creds, argon2 local
  credentials, dev login, JWT sessions, `passwordChangedAt` invalidation).
- Prisma 7 + Neon adapter; schema has the auth models + example `Note` resource +
  `AppSetting` + `AuditLog` + invite/reset tokens.
- Rate limiting (Upstash), Turnstile verify, CSP nonce proxy, security headers,
  AuditLog, CSP-report endpoint, audit-cleanup cron.
- shadcn/ui (Base UI + Lucide), dark mode, sign-in page, landing page.
- Example `POST/GET /api/notes` + `GET/PATCH/DELETE /api/notes/[id]` showing the
  owned-resource pattern (auth OR guest manage-token). Unit tests + Playwright smoke.
- **Type-safe env** (`@t3-oss/env-nextjs` + Zod, `src/env.ts`) — build fails fast on
  missing/invalid env. Bypass with `SKIP_ENV_VALIDATION=1`.
- **Password reset + invite acceptance** — `/api/auth/{forgot-password,reset-password,
accept-invite}` routes + `/forgot-password`, `/reset-password`, `/invite/[token]`
  pages. Scripts: `create-admin`, `create-invite`. Reset-password route has unit tests.
- **Prettier + pre-commit** (`simple-git-hooks` + `lint-staged`); CI runs `format:check`.
- **Admin** — `/admin/*` is ADMIN-guarded (`admin/layout.tsx`); `/admin/security` shows
  AuditLog stats + recent events + CSP mode + a clear-events server action. Admin link
  appears in the navbar for admins.
- **react-email** — branded templates in `src/emails/` rendered via `@react-email/render`
  in `src/lib/email.tsx`. Preview them with `pnpm email` (port 3001).
- **E2E** — `e2e/auth-notes.spec.ts` covers guest-ownership + authenticated notes flows
  (opt-in CI job). **Dependabot** weekly (npm + actions).
- **Arcjet** abuse protection (`src/lib/arcjet.ts`, `protectRequest`) — shield + bot
  detection + rate limiting on `POST /api/notes`, falling back to Upstash when
  `ARCJET_KEY` is unset. Complements Turnstile (invisible vs. explicit challenge).
- **Sentry** error monitoring (`src/instrumentation*.ts`, `src/sentry.*.config.ts`,
  `withSentryConfig`) — no-op without `NEXT_PUBLIC_SENTRY_DSN`; CSP allows Sentry ingest
  only when configured; source-map upload opt-in (`SENTRY_AUTH_TOKEN` + flip
  `@sentry/cli` to true). Verify with `GET /api/debug-sentry`.

Published as a private template repo: https://github.com/un5table/next-secure-starter

## Next steps (when starting a real project)

1. Rebrand: set `NEXT_PUBLIC_APP_NAME` / `_APP_URL` / `_BRAND_COLOR`, edit `src/lib/site.ts`.
2. Provision Neon + Upstash (Vercel Marketplace) and Resend; fill `.env.local`.
3. `pnpm db:generate && pnpm exec prisma migrate dev --name init && pnpm db:seed`.
4. Replace the `Note` model + routes with your domain. Keep the spine and the guard
   pattern (`POST /api/notes`).
5. Flip `CSP_MODE=enforcing` once you've watched `/api/csp-report` for violations.
6. Remaining (Tier 3, optional): multi-tenancy/orgs, Stripe billing.

## Open decisions

- Deployment config is `vercel.ts` (typed, via `@vercel/config`). Security headers
  stay in `next.config.ts` so they apply off-Vercel and in `next dev` too.
- E2E job in CI is opt-in (`vars.ENABLE_E2E=true` + Neon secrets). It now runs against
  this starter's **own dedicated Neon project** `next-secure-starter`
  (`patient-sun-99685153`, personal org `org-purple-field-23332033`) with a
  project-scoped API key — fully isolated from rtime. Verified green run `26791583182`.

## Required env vars

See `.env.example`. Locally you only strictly need `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, and `DEV_PASSWORD`. Everything else degrades
gracefully (OAuth disabled, rate-limit open, email logs to console, Turnstile skipped).
