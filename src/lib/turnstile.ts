/**
 * Verifies a Cloudflare Turnstile token server-side. If TURNSTILE_SECRET_KEY is
 * unset (local dev), verification is skipped (returns true) so guest flows work
 * offline. Configure the secret before production.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    },
  );

  const data = (await res.json().catch(() => ({ success: false }))) as {
    success: boolean;
  };
  return data.success === true;
}
