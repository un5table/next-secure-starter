import { Button, Link, Text } from "@react-email/components";
import { EmailLayout } from "./email-layout";

export default function PasswordResetEmail({
  resetUrl = "https://example.com/reset-password?token=preview",
  appName = "App",
  brandColor = "#2563eb",
}: {
  resetUrl?: string;
  appName?: string;
  brandColor?: string;
}) {
  return (
    <EmailLayout
      appName={appName}
      brandColor={brandColor}
      preview={`Reset your ${appName} password`}
    >
      <Text style={para}>
        We received a request to reset the password for your {appName} account.
      </Text>
      <Text style={para}>
        Click below to choose a new password. This link expires in{" "}
        <strong>15 minutes</strong>.
      </Text>
      <Button
        href={resetUrl}
        style={{ ...button, backgroundColor: brandColor }}
      >
        Reset my password
      </Button>
      <Text style={small}>
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
      <Text style={small}>
        Or copy this link:{" "}
        <Link href={resetUrl} style={{ color: brandColor }}>
          {resetUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

const para = {
  margin: "0 0 16px",
  fontSize: "15px",
  color: "#3f3f46",
  lineHeight: "1.6",
};
const small = {
  margin: "16px 0 0",
  fontSize: "12px",
  color: "#a1a1aa",
  lineHeight: "1.5",
};
const button = {
  display: "inline-block",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  margin: "16px 0",
};
