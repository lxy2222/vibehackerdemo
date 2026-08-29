import { z } from "zod";

export const AUDIT_STATUSES = ["ready", "needs_revision"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

const stringList = z
  .array(z.string())
  .catch([])
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

export const auditReportSchema = z.object({
  status: z.enum(AUDIT_STATUSES).catch("needs_revision"),
  blockers: stringList,
  suggestions: stringList,
  likelyFollowups: stringList,
  deliveryMessage: z.string().trim().catch(""),
});

export type AuditReport = z.infer<typeof auditReportSchema>;

export function emptyAudit(): AuditReport {
  return {
    status: "needs_revision",
    blockers: [],
    suggestions: [],
    likelyFollowups: [],
    deliveryMessage: "",
  };
}

export function finalizeAudit(report: Omit<AuditReport, "status">): AuditReport {
  const blockers = [...new Set(report.blockers.map((item) => item.trim()).filter(Boolean))];
  const suggestions = [...new Set(report.suggestions.map((item) => item.trim()).filter(Boolean))];
  const likelyFollowups = [...new Set(report.likelyFollowups.map((item) => item.trim()).filter(Boolean))];
  return {
    status: blockers.length > 0 ? "needs_revision" : "ready",
    blockers,
    suggestions,
    likelyFollowups,
    deliveryMessage: report.deliveryMessage.trim(),
  };
}
