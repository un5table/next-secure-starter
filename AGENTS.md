# AGENTS.md — project rules (canonical)

This is the single source of truth for how AI agents and humans build in this repo.
`CLAUDE.md` (Claude Code) and `.windsurfrules` (Windsurf) both point here. Read it
before non-trivial changes.

This project was generated from **next-secure-starter** — a security-first Next.js 16
template. The patterns below are the reason the template exists; preserve them.

## ARCH — Next.js 16 App Router

Use the App Router. Server Components by default; Client Components only where
interactivity is required. API logic lives in route handlers under `src/app/api`.
Params are async in Next 16: `{ params }: { params: Promise<{ id: string }> }`.

## AUTH — Authorization in handlers, never in the proxy

Enforce auth, roles, and ownership inside route handlers / the server data layer
using the helpers in `src/lib/auth-helpers.ts` (`getSession`, `requireSession`,
`requireRole`, `requireNoteOwner`). Do NOT put access-control logic in `src/proxy.ts`
(it only sets the CSP nonce + header). Guest ownership is proven by 256-bit tokens
whose SHA-256 hash is stored (`ownerTokenHash`); return the raw token exactly once.
Auth.js v5 + Prisma adapter; passwords hashed with argon2id.

- **Always pass OAuth credentials explicitly.** `Google()` shorthand reads
  `AUTH_GOOGLE_ID`, not `GOOGLE_CLIENT_ID`. Use the explicit `clientId`/`clientSecret`.
- **`allowDangerousEmailAccountLinking: true`** on OAuth providers, so email/password
  users can later sign in with OAuth on the same email.
- OAuth providers self-disable when their env vars are absent (see `src/auth.ts`).

## DB — Prisma schema discipline

Pooled connection for the app (`DATABASE_URL`), direct for migrations
(`DATABASE_URL_UNPOOLED`) — already wired in `prisma.config.ts`. Run
`pnpm db:generate` after every schema change before TypeScript sees it. Use
`pnpm exec prisma migrate dev --name <name>` for named migrations. Keep cascade
deletes intact. The Prisma client is generated to `src/generated/prisma` (gitignored).

## ABUSE — Guard guest endpoints

Any unauthenticated write must: call `protectRequest` (Arcjet shield + bot detection +
rate limit, falling back to the Upstash limiter when `ARCJET_KEY` is unset), honor the
`AppSetting.allowGuestWrites` kill-switch, require a Cloudflare Turnstile token
(`verifyTurnstile`), and apply Zod field-length caps. See `POST /api/notes` for the
canonical shape — copy it for new guest endpoints.

## SEC — Security headers & CSP

Static headers live in `next.config.ts`; the per-request CSP nonce lives in
`src/proxy.ts`. CSP ships in report-only mode (violations → `AuditLog` via
`/api/csp-report`); flip with `CSP_MODE=enforcing` (env only, no code change). Keep
the nonce chain intact: `proxy.ts` sets `x-nonce` → `layout.tsx` reads it → passes to
`<Providers nonce>` → `ThemeProvider`. `logAudit` is fire-and-forget — never await it.

## TEST — Always add tests

Every feature/bugfix adds or updates tests. New API routes need at minimum:
auth/ownership check, happy path, error cases. Mock the spine (`@/lib/prisma`,
`@/auth`, `@/lib/rate-limit`, `@/lib/turnstile`, email) in unit tests — see
`src/app/api/notes/__tests__/route.test.ts`. Prefer Playwright for critical flows.

## STYLE — Tailwind, shadcn & accessibility

TailwindCSS v4 + shadcn/ui (Base UI primitives, Lucide icons). Accessible semantics,
ARIA where needed, keyboard navigable, high-contrast focus states, mobile-first. Use
`cn()` from `@/lib/utils` for class merging. Add components with
`pnpm dlx shadcn@latest add <name>`.

## NO-HALLUCINATIONS

If unsure about a business rule, surface a TODO or update the spec/docs FIRST, then
implement. Do not invent API routes, DB fields, or features. Do not reintroduce
removed concepts (authz in the proxy, per-selection tables, raw token storage).

## Tooling

Pull current docs (Next.js 16, Auth.js v5, Prisma 7, Tailwind 4) before using their
APIs rather than relying on memory — these have changed across major versions. All
code must pass ESLint, `tsc --noEmit`, and `prisma format`.
