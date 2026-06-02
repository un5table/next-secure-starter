## What & why

<!-- Briefly describe the change and the motivation. Link any issue. -->

## Checklist

Mirrors the canonical rules in [`AGENTS.md`](../AGENTS.md). Tick what applies:

- [ ] **Auth/ownership** enforced in route handlers or the data layer — never in the proxy/middleware (`AUTH`).
- [ ] **Guest-writable endpoints** keep the guard pattern: rate limit + Turnstile/Arcjet + the `allowGuestWrites` kill-switch (`ABUSE`).
- [ ] **Schema changes** follow the discipline in `DB` and include a migration (`prisma migrate`).
- [ ] **Tests added/updated** — unit and/or Playwright for the changed behavior (`TEST`).
- [ ] **Accessibility** kept (semantics, keyboard, focus states) for UI changes (`STYLE`).
- [ ] No secrets committed; new env vars added to `src/env.ts` **and** `.env.example`.
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass locally.

## Notes

<!-- Screenshots, follow-ups, or anything reviewers should know. -->
