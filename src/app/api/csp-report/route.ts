import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

// Receives browser CSP violation reports and records them to AuditLog. Review
// these (build an /admin/security page) before flipping CSP_MODE=enforcing.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  try {
    const body = (await request.json()) as {
      "csp-report"?: Record<string, string>;
    };
    const report = body["csp-report"] ?? {};
    logAudit("csp-violation", {
      ip,
      meta: {
        directive: report["violated-directive"] ?? null,
        blockedUri: report["blocked-uri"] ?? null,
        documentUri: report["document-uri"] ?? null,
      },
    });
  } catch {
    // Malformed report — ignore.
  }
  return new NextResponse(null, { status: 204 });
}
