import { INTENT_LABELS, type ReportAnalysis } from "@/lib/schemas/analysis";
import {
  CONSULTING_LAYOUTS,
  consultingDeckSchema,
  isConsultingLayout,
  type ConsultingDeck,
  type DeckSpec,
  type LayoutId,
  type SlideBlock,
  type SlideSpec,
  type SlideType,
} from "@/lib/schemas/deck";
import { COVER_SECONDS, MAX_PAGE_COUNT, SLIDE_SECONDS } from "@/lib/presentation/limits";

const MAX_HEADLINE_CHARS = 56;
const MAX_BLOCKS = 4;

export function clipConclusion(text: string, max = MAX_HEADLINE_CHARS) {
  const chars = [...text.trim()];
  return chars.length <= max ? text.trim() : chars.slice(0, max).join("");
}

export function parseConsultingDeck(value: unknown): ConsultingDeck {
  return consultingDeckSchema.parse(value);
}

function cleanBlock(block: SlideBlock): SlideBlock | null {
  const label = block.label.trim();
  const value = block.value.trim();
  const detail = block.detail.trim();
  if (!label && !value && !detail) {
    return null;
  }
  const missing = block.status === "missing" || (!value && !detail);
  return {
    kind: block.kind,
    label: label || "证据",
    value: missing && !value ? "待补充" : value,
    detail,
    sourceRef: block.sourceRef.trim(),
    status: missing ? "missing" : block.status,
  };
}

function bulletsFrom(blocks: SlideBlock[], implication: string) {
  const fromBlocks = blocks.map((block) => {
    const head = block.value ? `${block.label}：${block.value}` : block.label;
    return block.detail ? `${head}。${block.detail}` : head;
  });
  if (implication.trim()) {
    fromBlocks.push(`管理含义：${implication.trim()}`);
  }
  return fromBlocks;
}

function asSlideType(layoutId: LayoutId): SlideType {
  return layoutId;
}

function contentSlide(raw: ConsultingDeck["slides"][number], index: number): SlideSpec | null {
  if (raw.slideType === "cover") {
    return null;
  }
  const layoutId = CONSULTING_LAYOUTS.includes(raw.layoutId) ? raw.layoutId : "progress_evidence";
  const headline = clipConclusion(raw.headline);
  const blocks = raw.blocks.map(cleanBlock).filter((item): item is SlideBlock => Boolean(item)).slice(0, MAX_BLOCKS);
  const implication = raw.managementImplication.trim();
  if (!headline && blocks.length === 0) {
    return null;
  }
  return {
    id: `s${index + 1}`,
    type: asSlideType(layoutId),
    layoutId,
    eyebrow: raw.eyebrow.trim() || defaultEyebrow(layoutId),
    headline: headline || implication || "材料仍不足以形成更锋利的结论",
    takeaway: implication,
    bullets: bulletsFrom(blocks, implication),
    blocks,
    managementImplication: implication,
    factRefs: [],
    speakerNotes: raw.speakerNotes.trim(),
    estimatedSeconds: SLIDE_SECONDS,
  };
}

function defaultEyebrow(layoutId: LayoutId) {
  switch (layoutId) {
    case "executive_summary_split":
      return "EXECUTIVE SUMMARY";
    case "metric_grid":
      return "KEY METRICS";
    case "chart_plus_insight":
      return "INSIGHT";
    case "comparison":
      return "COMPARISON";
    case "timeline_risk":
      return "TIMELINE";
    case "decision_actions":
      return "DECISION";
    case "progress_evidence":
      return "PROJECT UPDATE";
  }
}

export function consultingDeckToSpec(input: {
  consulting: ConsultingDeck;
  analysis: ReportAnalysis;
  durationMinutes: number;
}): DeckSpec {
  const title = clipConclusion(input.consulting.deckTitle || input.analysis.title || "工作汇报", 24);
  const audience = input.consulting.audience.trim() || "管理层";
  const reportGoal = input.consulting.reportGoal.trim() || input.analysis.leaderQuestion;
  const subtitle = `${INTENT_LABELS[input.analysis.intent]} · ${input.durationMinutes} 分钟`;

  const cover: SlideSpec = {
    id: "s1",
    type: "cover",
    eyebrow: "MANAGEMENT BRIEFING",
    headline: title,
    takeaway: reportGoal,
    bullets: [audience, subtitle].filter(Boolean),
    blocks: [],
    managementImplication: "",
    factRefs: [],
    speakerNotes: "",
    estimatedSeconds: COVER_SECONDS,
  };

  const content = input.consulting.slides
    .map((slide, index) => contentSlide(slide, index + 1))
    .filter((slide): slide is SlideSpec => Boolean(slide))
    .slice(0, MAX_PAGE_COUNT - 1);

  return {
    title,
    subtitle,
    audience,
    reportGoal,
    slides: [cover, ...content].map((slide, index) => ({ ...slide, id: `s${index + 1}` })),
  };
}

export function hasConsultingContent(deck: DeckSpec | null | undefined) {
  return Boolean(deck?.slides.some((slide) => isConsultingLayout(slide.type) || (slide.blocks?.length ?? 0) > 0));
}
