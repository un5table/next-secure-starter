import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@/env";
import PasswordResetEmail from "@/emails/password-reset";
import InviteEmail from "@/emails/invite";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const APP_NAME = env.NEXT_PUBLIC_APP_NAME ?? "App";
// Resend's onboarding@resend.dev works without domain verification for testing.
const FROM = env.RESEND_FROM ?? `${APP_NAME} <onboarding@resend.dev>`;
const BRAND = env.NEXT_PUBLIC_BRAND_COLOR ?? "#2563eb";

/**
 * Sends an email via Resend. If RESEND_API_KEY is unset (local dev), logs to the
 * console and returns without throwing — so flows that send email still work offline.
 */
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — would send to ${to}: "${subject}"`,
    );
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const html = await render(
    <PasswordResetEmail
      resetUrl={resetUrl}
      appName={APP_NAME}
      brandColor={BRAND}
    />,
  );
  await send(to, `Reset your ${APP_NAME} password`, html);
}

export async function sendInviteEmail(
  to: string,
  inviteUrl: string,
): Promise<void> {
  const html = await render(
    <InviteEmail inviteUrl={inviteUrl} appName={APP_NAME} brandColor={BRAND} />,
  );
  await send(to, `You've been invited to ${APP_NAME}`, html);
}

/** Generic sender for ad-hoc transactional emails (pass pre-rendered HTML). */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  await send(to, subject, html);
}
