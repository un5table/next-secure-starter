import { Button, Link, Text } from "@react-email/components";
import { EmailLayout } from "./email-layout";

export default function InviteEmail({
  inviteUrl = "https://example.com/invite/preview",
  appName = "App",
  brandColor = "#2563eb",
}: {
  inviteUrl?: string;
  appName?: string;
  brandColor?: string;
}) {
  return (
    <EmailLayout
      appName={appName}
      brandColor={brandColor}
      preview={`You've been invited to ${appName}`}
    >
      <Text style={para}>
        You&apos;ve been invited to join <strong>{appName}</strong>.
      </Text>
      <Text style={para}>
        Click below to accept your invitation and set up your account. This link
        expires in <strong>72 hours</strong>.
      </Text>
      <Button
        href={inviteUrl}
        style={{ ...button, backgroundColor: brandColor }}
      >
        Accept invitation
      </Button>
      <Text style={small}>
        If you weren&apos;t expecting this, you can safely ignore this email.
      </Text>
      <Text style={small}>
        Or copy this link:{" "}
        <Link href={inviteUrl} style={{ color: brandColor }}>
          {inviteUrl}
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
