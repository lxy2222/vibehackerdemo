import { z } from "zod";

export const REPORT_INTENTS = [
  "result",
  "progress",
  "retrospective",
  "decision",
  "product_conversion",
] as const;

export type ReportIntent = (typeof REPORT_INTENTS)[number];

export const INTENT_LABELS: Record<ReportIntent, string> = {
  result: "结果汇报",
  progress: "进度汇报",
  retrospective: "项目复盘",
  decision: "决策汇报",
  product_conversion: "产品使用或转化",
};

const stringList = z
  .array(z.string())
  .catch([])
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

export const reportAnalysisSchema = z.object({
  title: z.string().trim().catch(""),
  leaderQuestion: z.string().trim().min(1).catch("本次汇报要让领导判断什么"),
  intent: z.enum(REPORT_INTENTS).catch("progress"),
  coreConclusion: z.string().trim().min(1).catch("材料还不足以给出更锋利的结论"),
  keyFindings: stringList,
  risks: stringList,
  nextActions: stringList,
  decisionAsk: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || undefined),
  missingInformation: stringList,
  excludedDetails: stringList,
});

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>;

export function emptyAnalysis(): ReportAnalysis {
  return {
    title: "",
    leaderQuestion: "",
    intent: "progress",
    coreConclusion: "",
    keyFindings: [],
    risks: [],
    nextActions: [],
    decisionAsk: undefined,
    missingInformation: [],
    excludedDetails: [],
  };
}
