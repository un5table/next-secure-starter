// Debug endpoint: GET /api/debug-sentry throws a server error that Sentry captures
// via the onRequestError hook in src/instrumentation.ts. Hit it once with a DSN
// configured to confirm events arrive in your Sentry project, then delete this file.
export async function GET() {
  throw new Error(
    "Sentry debug: intentional error to verify error monitoring.",
  );
}
