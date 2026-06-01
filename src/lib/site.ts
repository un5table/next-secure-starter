// Central place for app identity. Wire these to NEXT_PUBLIC_* env vars so the
// same template can be rebranded per project without code edits.
export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Secure Starter",
  description:
    "A production-ready, security-first Next.js starter — Auth.js v5, Prisma, rate limiting, CSP, and audit logging out of the box.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
