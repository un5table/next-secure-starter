# CLAUDE.md — Claude Code instructions

The canonical project rules live in @AGENTS.md — read it first. This file adds the
Claude-specific session protocol and the hard-won gotchas.

## Session protocol
- **START:** read `docs/HANDOFF.md`, then run `git log --oneline -15` and `git status`
  to see the exact current state before doing anything.
- **WORK:** follow `AGENTS.md`. Commit in small, descriptive increments.
- **END:** commit outstanding work, then update `docs/HANDOFF.md` so a fresh session
  (or another tool, e.g. Windsurf) can resume cleanly. The cross-tool channel is
  git + docs/HANDOFF.md — neither tool can see the other's chat history or memory.

## Hard-won gotchas (check before coding)

### Auth.js v5
- **Pass OAuth credentials explicitly** — `Google()` reads `AUTH_GOOGLE_ID`, not
  `GOOGLE_CLIENT_ID`. Always `Google({ clientId: process.env.GOOGLE_CLIENT_ID, ... })`.
- **`allowDangerousEmailAccountLinking: true`** on all OAuth providers.
- **JWT sessions** — the `Session` table is unused; role changes apply on next sign-in.
- **`passwordChangedAt` invalidates JWTs** — the `jwt()` callback returns `null` (forces
  re-auth) when the DB timestamp is newer than the JWT watermark. One SELECT per refresh.

### Prisma / DB
- **`pnpm db:generate` after every schema change** before TypeScript picks it up.
- **`pnpm exec prisma migrate dev --name <name>`** for named migrations (the `db:migrate`
  script can't take a name in some shells).
- **Pooled `DATABASE_URL` for the app, direct `DATABASE_URL_UNPOOLED` for migrations** —
  already wired in `prisma.config.ts`. Don't change this.
- **`src/generated/prisma` is gitignored** — generate it locally; CI does too.

### Proxy / CSP (Next.js 16)
- **The CSP file is `src/proxy.ts`** (Next 16 renamed `middleware.ts` → `proxy.ts`).
  Same API (`export function proxy`, `export const config`). Don't rename it back.
- **Keep the nonce chain intact:** `proxy.ts` → `x-nonce` header → `layout.tsx`
  `headers()` (async layout) → `<Providers nonce>` → `ThemeProvider`.
- **`logAudit` is fire-and-forget** — never await it; it catches its own errors.

### Platform / tooling
- **PowerShell has no `&&`** — use `;` or separate commands.
- **`vercel.json` must have `"framework": "nextjs"`** or routes 404.
- **`build` script must start with `prisma generate &&`** — the client is gitignored.
- **pnpm 11 gates native build scripts** — approved in `pnpm-workspace.yaml`
  (`allowBuilds`). Add new native deps there or installs print ignored-build warnings.
- **`isValidTimezone("EST")` is true on Windows** — use a real IANA zone in tz tests.

## What this project is
A security-first Next.js 16 starter: Auth.js v5 (OAuth + argon2 local creds, JWT,
invites, reset), Prisma 7 + Neon, Upstash rate limiting, Turnstile, CSP with nonce,
AuditLog, shadcn/ui. The example `Note` resource demonstrates the owned-resource
pattern — replace it with your domain, keep the spine.
