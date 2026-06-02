import * as Sentry from "@sentry/nextjs";

// Next.js loads this once per runtime. We import the matching Sentry config so
// server and edge errors are captured. (Client init lives in instrumentation-client.ts.)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in Server Components, route handlers, and middleware.
export const onRequestError = Sentry.captureRequestError;
