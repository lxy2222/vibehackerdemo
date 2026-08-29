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

export const INTENT_FOCUS: Record<ReportIntent, string> = {
  result: "围绕已经做成的结果：领导要判断效果够不够。结论写结果，发现写可对照的产出，不要写成流水账进度。",
  progress: "围绕现在做到哪：领导要判断是否按计划、卡在哪。结论写当前状态和阻塞，不要写成已经证明结果。",
  retrospective: "围绕原定目标和最终结果：做对了什么、没做成什么、原因是什么。",
  decision: "围绕需要当场拍的板：选项、代价、推荐，不要只同步进展。",
  product_conversion: "围绕使用或转化：卡在哪一步、下一步改什么。材料没有转化数字就不要编漏斗。",
};

export const INTENT_SLIDE_LABELS: Record<
  ReportIntent,
  { summary: string; diagnosis: string; action: string }
> = {
  result: { summary: "核心结论", diagnosis: "风险点", action: "下一步与拍板" },
  progress: { summary: "当前进展", diagnosis: "阻塞与风险", action: "下一步与协调" },
  retrospective: { summary: "复盘结论", diagnosis: "未达成与原因", action: "下一阶段调整" },
  decision: { summary: "需要决定的问题", diagnosis: "限制与风险", action: "选项与拍板" },
  product_conversion: { summary: "核心结论", diagnosis: "流失与原因", action: "优化行动" },
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
