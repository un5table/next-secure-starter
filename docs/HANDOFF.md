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

## Next steps (when starting a real project)
1. Rebrand: set `NEXT_PUBLIC_APP_NAME` / `_APP_URL` / `_BRAND_COLOR`, edit `src/lib/site.ts`.
2. Provision Neon + Upstash (Vercel Marketplace) and Resend; fill `.env.local`.
3. `pnpm db:generate && pnpm exec prisma migrate dev --name init && pnpm db:seed`.
4. Replace the `Note` model + routes with your domain. Keep the spine and the guard
   pattern (`POST /api/notes`).
5. Build out auth flows you need (forgot/reset password, accept-invite routes + pages)
   using `sendPasswordResetEmail` / `sendInviteEmail` and the token helpers.
6. Flip `CSP_MODE=enforcing` once you've watched `/api/csp-report` for violations.

## Open decisions
- Deployment config is `vercel.json` (reliable). Optional modern alternative:
  `vercel.ts` via `@vercel/config` — migrate if you want typed/dynamic config.
- E2E job in CI is opt-in (`vars.ENABLE_E2E=true` + Neon secrets).

## Required env vars
See `.env.example`. Locally you only strictly need `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, and `DEV_PASSWORD`. Everything else degrades
gracefully (OAuth disabled, rate-limit open, email logs to console, Turnstile skipped).
