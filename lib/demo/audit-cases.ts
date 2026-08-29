import { DEMO_MATERIALS, DEMO_REPORT_BACKGROUND } from "@/lib/demo/narrative";

export type AuditCaseId = "ready" | "blocker" | "suggestion";

export type AuditCase = {
  id: AuditCaseId;
  label: string;
  hint: string;
  reportBackground: string;
  materials: string;
  durationMinutes: number;
};

export const AUDIT_CASES: Record<AuditCaseId, AuditCase> = {
  ready: {
    id: "ready",
    label: "完整 demo",
    hint: "跨国家复用，有工期对比，领导没点名具体指标",
    reportBackground: DEMO_REPORT_BACKGROUND,
    materials: DEMO_MATERIALS,
    durationMinutes: 5,
  },
  blocker: {
    id: "blocker",
    label: "点名转化（应阻塞）",
    hint: "领导点名要看转化率，但材料没有表格或数字",
    reportBackground:
      "周五给管理层五分钟。领导点名要看转化率和各渠道转化对比，没有转化数字不要上台。技术细节少讲。",
    materials: `A：这周活动感觉还行，几个渠道都有在跑。
B：转化率出来了吗？各渠道对比呢？
A：表还没拉，我这边只有感觉，具体转化对不上。
B：那漏斗卡在哪也不清楚？
A：对，先别写太满，数字我还没有。`,
    durationMinutes: 5,
  },
  suggestion: {
    id: "suggestion",
    label: "缺量化（建议不阻塞）",
    hint: "只讲进展和卡点，领导没有点名指标",
    reportBackground:
      "周五周会同频一下项目进展，大概五分钟，把卡点和下一步讲清楚就行，没有特别要求看哪个数字。",
    materials: `A：重构四个 PR 已经合了，还有一个在 review。
B：email 验证呢？
A：还在等 PM 文档，所以卡住了。
B：这周需要领导拍什么板吗？
A：帮我问一下后端排期，以及做完之后下一步做什么。`,
    durationMinutes: 5,
  },
};

export function getAuditCase(id: string | null | undefined): AuditCase {
  if (id === "blocker" || id === "suggestion" || id === "ready") {
    return AUDIT_CASES[id];
  }
  return AUDIT_CASES.ready;
}
