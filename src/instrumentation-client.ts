import * as Sentry from "@sentry/nextjs";

// Client-side Sentry init. No-ops without a DSN. NEXT_PUBLIC_ vars are inlined
// by Next.js at build time.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1,
  debug: false,
});

// Instruments client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
