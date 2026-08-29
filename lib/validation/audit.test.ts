import assert from "node:assert/strict";
import { test } from "node:test";
import { AUDIT_CASES } from "../demo/audit-cases";
import { emptyAnalysis } from "../schemas/analysis";
import { demandedMetrics, runCodeAudit } from "./audit";

const deck = {
  title: "测试汇报",
  subtitle: "5 分钟",
  slides: [
    {
      id: "s1",
      type: "cover" as const,
      headline: "测试汇报",
      takeaway: "领导要判断什么",
      bullets: ["进度汇报 · 5 分钟"],
      factRefs: [],
      speakerNotes: "",
      estimatedSeconds: 20,
    },
    {
      id: "s2",
      type: "executive_summary" as const,
      headline: "核心结论",
      takeaway: "先把进展讲清楚",
      bullets: ["重构四个 PR 已合"],
      factRefs: [],
      speakerNotes: "按材料讲",
      estimatedSeconds: 50,
    },
    {
      id: "s3",
      type: "diagnosis" as const,
      headline: "风险点",
      takeaway: "还有卡点",
      bullets: ["PM 文档未出"],
      factRefs: [],
      speakerNotes: "只讲风险",
      estimatedSeconds: 50,
    },
    {
      id: "s4",
      type: "recommendations" as const,
      headline: "下一步",
      takeaway: "问后端排期",
      bullets: ["确认下一步"],
      factRefs: [],
      speakerNotes: "只讲行动",
      estimatedSeconds: 50,
    },
  ],
};

function auditCase(id: keyof typeof AUDIT_CASES) {
  const fixture = AUDIT_CASES[id];
  return runCodeAudit({
    reportBackground: fixture.reportBackground,
    materials: fixture.materials,
    durationMinutes: fixture.durationMinutes,
    analysis: {
      ...emptyAnalysis(),
      title: "测试",
      leaderQuestion: "这次要判断什么",
      coreConclusion: "先把进展讲清楚",
    },
    deck,
    facts: [],
  });
}

test("完整 demo 不阻塞，缺量化只是建议", () => {
  const report = auditCase("ready");
  assert.equal(report.status, "ready");
  assert.equal(report.blockers.length, 0);
  assert.match(report.suggestions.join("\n"), /缺量化/);
  assert.match(report.deliveryMessage, /可以交/);
});

test("点名转化且没有数字会阻塞", () => {
  assert.deepEqual(demandedMetrics(AUDIT_CASES.blocker.reportBackground), ["转化率"]);
  const report = auditCase("blocker");
  assert.equal(report.status, "needs_revision");
  assert.match(report.blockers.join("\n"), /转化率/);
});

test("没点名指标时缺量化不阻塞", () => {
  const report = auditCase("suggestion");
  assert.equal(report.status, "ready");
  assert.equal(report.blockers.length, 0);
  assert.match(report.suggestions.join("\n"), /缺量化/);
});
