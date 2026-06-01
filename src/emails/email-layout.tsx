import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared branded shell for transactional emails. Presentational only — pass
 * appName/brandColor as props (defaults keep the react-email preview standalone,
 * so `pnpm email` works without any env).
 */
export function EmailLayout({
  appName = "App",
  brandColor = "#2563eb",
  preview,
  children,
}: {
  appName?: string;
  brandColor?: string;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: brandColor }}>
            <Text style={brand}>{appName}</Text>
          </Section>
          <Section style={content}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  margin: 0,
  padding: "40px 16px",
};
const container = {
  maxWidth: "520px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e4e4e7",
  overflow: "hidden",
};
const header = { padding: "20px 32px" };
const brand = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.5px",
  margin: 0,
};
const content = { padding: "32px" };
