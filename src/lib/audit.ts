import { prisma } from "./prisma";

export type AuditAction =
  | "csp-violation"
  | "rate-limit-hit"
  | "password-reset-requested"
  | "password-reset-completed"
  | "invite-accepted";

/**
 * Fire-and-forget security logging. NEVER await this in a route handler — it
 * catches its own errors so logging can never throw or block a response.
 */
export function logAudit(
  action: AuditAction,
  opts: { ip?: string; meta?: Record<string, string | null | undefined> } = {},
) {
  prisma.auditLog
    .create({ data: { action, ip: opts.ip ?? null, meta: opts.meta } })
    .catch(() => {});
}
