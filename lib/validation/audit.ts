import type { ReportAnalysis } from "@/lib/schemas/analysis";
import { finalizeAudit, type AuditReport } from "@/lib/schemas/audit";
import type { DeckSpec, Fact } from "@/lib/presentation/types";
import { findNakedNumbers } from "@/lib/validation/deck";

export type CodeAuditInput = {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis | null;
  deck: DeckSpec | null;
  facts: Fact[];
  pptxBytes?: number | null;
};

const NAMED_METRICS = [
  { name: "转化率", demand: /转化率|转化漏斗|各渠道转化/ },
  { name: "故障率", demand: /故障率/ },
  { name: "客诉", demand: /客诉率|客诉数/ },
  { name: "收入", demand: /收入|营收|GMV/ },
  { name: "ROI", demand: /\bROI\b|投入产出/ },
  { name: "留存", demand: /留存率|留存/ },
  { name: "点击率", demand: /点击率|\bCTR\b/ },
] as const;

function sourceText(input: CodeAuditInput) {
  const factText = input.facts
    .map((fact) => `${fact.label} ${fact.value} ${fact.unit ?? ""}`)
    .join("\n");
  return `${input.reportBackground}\n${input.materials}\n${factText}`;
}

function deckText(deck: DeckSpec) {
  return deck.slides
    .flatMap((slide) => [slide.headline, slide.takeaway, ...slide.bullets, slide.speakerNotes])
    .join("\n");
}

export function demandedMetrics(reportBackground: string) {
  return NAMED_METRICS.filter((metric) => metric.demand.test(reportBackground)).map((metric) => metric.name);
}

export function hasQuantification(text: string) {
  return findNakedNumbers(text).length > 0 || /\d+(?:\.\d+)?%/.test(text);
}

export function runCodeAudit(input: CodeAuditInput): AuditReport {
  const blockers: string[] = [];
  const suggestions: string[] = [];
  const source = sourceText(input);

  if (!input.analysis) {
    blockers.push("还没有确认主线，不能验收。");
  }
  if (!input.deck || input.deck.slides.length === 0) {
    blockers.push("还没有预览稿。");
  }

  if (input.deck) {
    if (!input.deck.slides.some((slide) => slide.type === "cover")) {
      blockers.push("缺少封面页。");
    }
    if (input.deck.slides.length < 3) {
      blockers.push(`页数过少（${input.deck.slides.length} 页），结论、风险和下一步讲不完。`);
    }
    if (input.deck.slides.length > 12) {
      blockers.push(`页数过多（${input.deck.slides.length} 页），超过可讲解范围。`);
    }

    const factIds = new Set(input.facts.map((fact) => fact.id));
    const missingRefs = input.deck.slides.flatMap((slide) =>
      [...slide.factRefs, ...(slide.chart?.factRefs ?? [])].filter((id) => !factIds.has(id)),
    );
    if (missingRefs.length > 0) {
      blockers.push(`幻灯片引用了不存在的事实：${[...new Set(missingRefs)].join("、")}`);
    }

    const spokenSeconds = input.deck.slides.reduce((sum, slide) => sum + (slide.estimatedSeconds || 0), 0);
    const budget = input.durationMinutes * 60;
    if (budget > 0 && spokenSeconds > budget * 1.2) {
      blockers.push(
        `讲解时长约 ${Math.round(spokenSeconds / 60)} 分钟，超过要求的 ${input.durationMinutes} 分钟超过 20%。`,
      );
    }

    const invented = findNakedNumbers(deckText(input.deck)).filter((item) => !source.includes(item));
    if (invented.length > 0) {
      blockers.push(`稿子里出现材料没有的数字：${[...new Set(invented)].join("、")}`);
    }
  }

  const named = demandedMetrics(input.reportBackground);
  for (const name of named) {
    const inFacts = input.facts.some((fact) => fact.label.includes(name));
    const inMaterials = input.materials.includes(name) && hasQuantification(input.materials);
    if (!inFacts && !inMaterials) {
      blockers.push(`领导点名要看${name}，材料里没有对应数字或表格。`);
    }
  }

  if (named.length === 0 && !hasQuantification(input.materials) && input.facts.length === 0) {
    suggestions.push("缺量化：材料里没有表格或可上台的数字，建议补关键指标，但不阻塞提交。");
  }

  if (input.analysis && input.analysis.missingInformation.length > 0 && named.length === 0) {
    suggestions.push(...input.analysis.missingInformation.slice(0, 3));
  }

  if (input.pptxBytes === 0) {
    blockers.push("已导出的 PPTX 是空文件。");
  }

  const deliveryMessage = fallbackDeliveryMessage(input, blockers, suggestions);
  return finalizeAudit({
    blockers,
    suggestions,
    likelyFollowups: [],
    deliveryMessage,
  });
}

export function fallbackDeliveryMessage(
  input: CodeAuditInput,
  blockers: string[],
  suggestions: string[],
) {
  const question = input.analysis?.leaderQuestion || "本次要同步的问题";
  const conclusion = input.analysis?.coreConclusion || "结论仍待确认";
  if (blockers.length > 0) {
    return `这份稿还不能交。领导要判断的是：${question}。当前阻塞：${blockers[0]}`;
  }
  const extra = suggestions[0] ? `补充：${suggestions[0]}` : "材料里的数字都可追溯，没有编造。";
  return `这份稿可以交。领导要判断的是：${question}。结论：${conclusion}。${extra}`;
}

export function mergeAudits(code: AuditReport, semantic: Partial<AuditReport>): AuditReport {
  return finalizeAudit({
    blockers: [...code.blockers, ...(semantic.blockers ?? [])],
    suggestions: [...code.suggestions, ...(semantic.suggestions ?? [])],
    likelyFollowups: semantic.likelyFollowups ?? [],
    deliveryMessage: semantic.deliveryMessage?.trim() || code.deliveryMessage,
  });
}
