import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "App";
// Resend's onboarding@resend.dev works without domain verification for testing.
const FROM = process.env.RESEND_FROM ?? `${APP_NAME} <onboarding@resend.dev>`;
const BRAND = process.env.NEXT_PUBLIC_BRAND_COLOR ?? "#2563eb";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(APP_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="background:${BRAND};padding:20px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${escapeHtml(APP_NAME)}</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;margin:16px 0;">${label}</a>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">${text}</p>`;
}

function small(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">${text}</p>`;
}

/**
 * Sends an email via Resend. If RESEND_API_KEY is unset (local dev), logs to the
 * console and returns without throwing — so flows that send email still work offline.
 */
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — would send to ${to}: "${subject}"`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const html = baseTemplate(`
    ${p(`We received a request to reset the password for your ${escapeHtml(APP_NAME)} account.`)}
    ${p("Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.")}
    ${button(resetUrl, "Reset my password")}
    ${small(`If you didn't request this, you can safely ignore this email.<br/>Or copy this link: <a href="${resetUrl}" style="color:${BRAND};">${resetUrl}</a>`)}
  `);
  await send(to, `Reset your ${APP_NAME} password`, html);
}

export async function sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
  const html = baseTemplate(`
    ${p(`You've been invited to join <strong>${escapeHtml(APP_NAME)}</strong>.`)}
    ${p("Click below to accept your invitation and set up your account. This link expires in <strong>72 hours</strong>.")}
    ${button(inviteUrl, "Accept invitation")}
    ${small(`If you weren't expecting this, you can safely ignore this email.<br/>Or copy this link: <a href="${inviteUrl}" style="color:${BRAND};">${inviteUrl}</a>`)}
  `);
  await send(to, `You've been invited to ${APP_NAME}`, html);
}

/** Generic sender for ad-hoc transactional emails. */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await send(to, subject, baseTemplate(html));
}
