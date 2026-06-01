import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearAuditLog } from "./actions";

export const metadata: Metadata = { title: "Security" };

// Reads the session (via the layout guard) → always rendered on demand.
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

// Kept out of the component body so the impure Date/now calls don't trip the
// react-hooks purity rule.
async function loadSecurityOverview() {
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [total, last24h, last7d, recent] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: since7d } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return { total, last24h, last7d, recent };
}

export default async function SecurityPage() {
  const { total, last24h, last7d, recent } = await loadSecurityOverview();
  const cspMode = env.CSP_MODE ?? "report-only";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">
          Audit events and content-security-policy status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events (24h)" value={last24h} />
        <Stat label="Events (7d)" value={last7d} />
        <Stat label="Events (all time)" value={total} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content-Security-Policy</CardTitle>
          <CardDescription>
            Currently{" "}
            <span className="font-mono font-medium text-foreground">
              {cspMode}
            </span>
            .{" "}
            {cspMode === "report-only"
              ? "Watch for violations below, then set CSP_MODE=enforcing to block them (no redeploy of code needed)."
              : "Violations are being blocked."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent events</CardTitle>
            <CardDescription>Latest 50 audit-log entries.</CardDescription>
          </div>
          <form action={clearAuditLog}>
            <Button type="submit" variant="destructive" size="sm">
              Clear all
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">IP</th>
                  <th className="py-2 pr-4 font-medium">Details</th>
                  <th className="py-2 font-medium">When (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 align-top"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {e.ip ?? "—"}
                    </td>
                    <td className="max-w-[20rem] truncate py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {e.meta ? JSON.stringify(e.meta) : "—"}
                    </td>
                    <td className="py-2 text-xs whitespace-nowrap text-muted-foreground">
                      {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
