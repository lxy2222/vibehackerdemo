import assert from "node:assert/strict";
import { test } from "node:test";
import { consultingDeckToSpec, parseConsultingDeck } from "../presentation/from-consulting";
import { emptyAnalysis } from "../schemas/analysis";

test("consulting JSON becomes cover plus evidence slides", () => {
  const consulting = parseConsultingDeck({
    deckTitle: "跨国家复用交付进展",
    audience: "管理层周会",
    reportGoal: "要不要先补新加坡设计人手",
    slides: [
      {
        slideType: "content",
        layoutId: "progress_evidence",
        eyebrow: "PROJECT UPDATE",
        headline: "印尼复用已把交付从数月压到数周，下一阶段卡在人手而不是方案",
        blocks: [
          {
            kind: "metric",
            label: "印尼复用",
            value: "约 2 周",
            detail: "复用现有方案后明显缩短。",
            sourceRef: "工作对话",
            status: "confirmed",
          },
          {
            kind: "risk",
            label: "稳定性口径",
            value: "",
            detail: "故障率和客诉未对齐。",
            sourceRef: "工作对话",
            status: "missing",
          },
          {
            kind: "action",
            label: "补人手",
            value: "这周拍板",
            detail: "新加坡设计排期已后推。",
            sourceRef: "工作对话",
            status: "confirmed",
          },
        ],
        managementImplication: "需要当场决定是否先补新加坡设计人手。",
        speakerNotes: "先讲效率，再讲人手。",
      },
    ],
  });

  const deck = consultingDeckToSpec({
    consulting,
    analysis: {
      ...emptyAnalysis(),
      title: "跨国家复用交付进展",
      leaderQuestion: "要不要先补新加坡设计人手",
      intent: "result",
      coreConclusion: "复用已经证明更快",
    },
    durationMinutes: 5,
  });

  assert.equal(deck.slides[0]?.type, "cover");
  assert.equal(deck.slides[1]?.type, "progress_evidence");
  assert.equal(deck.slides[1]?.layoutId, "progress_evidence");
  assert.match(deck.slides[1]?.headline ?? "", /人手/);
  assert.equal(deck.slides[1]?.blocks?.[1]?.status, "missing");
  assert.equal(deck.slides[1]?.blocks?.[1]?.value, "待补充");
  assert.match(deck.slides[1]?.managementImplication ?? "", /新加坡/);
});
