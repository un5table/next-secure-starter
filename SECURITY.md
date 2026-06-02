# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately via GitHub's [**Report a vulnerability**](https://github.com/un5table/next-secure-starter/security/advisories/new)
flow (Security → Advisories), which opens a confidential channel with the maintainers.

Please include:

- a description of the issue and its impact,
- steps to reproduce (a proof of concept if you have one),
- affected versions / commit, and any suggested remediation.

You can expect an initial acknowledgement within a few days. We'll keep you
updated as we triage, fix, and coordinate disclosure.

## Scope

This is a starter template. Findings in the template's own code (auth flow, the
owned-resource guard pattern, CSP/headers, rate limiting, audit logging) are in
scope. Issues in third-party dependencies should be reported upstream, though a
heads-up here is welcome if the template's usage is what exposes them.

## For projects built from this template

The template ships a defensible baseline, but security is your responsibility
once you build on it. Before going to production, at minimum:

- set strong secrets (`AUTH_SECRET`, `CRON_SECRET`) and never commit `.env*`,
- provision Upstash so rate limiting is enforced (it's open without it),
- flip `CSP_MODE=enforcing` after watching `/api/csp-report` for violations,
- keep dependencies patched (Dependabot + `pnpm audit` run in CI), and
- review the rules in [`AGENTS.md`](./AGENTS.md).
