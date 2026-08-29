import type PptxGenJS from "pptxgenjs";
import { parseBlockNumber, statusLabel } from "@/lib/presentation/blocks";
import { theme } from "@/lib/presentation/theme";
import type { LayoutId, SlideBlock, SlideSpec } from "@/lib/schemas/deck";

type Slide = ReturnType<InstanceType<typeof PptxGenJS>["addSlide"]>;

const DARK = "3D3348";
const CARD = "FFFFFF";
const LINE = "F3DCE6";

function textOpts(overrides: Record<string, unknown> = {}) {
  return {
    fontFace: theme.font,
    color: theme.title,
    margin: 0,
    ...overrides,
  };
}

function addAccent(slide: Slide) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.12,
    h: 7.5,
    fill: { color: theme.accent },
    line: { color: theme.accent },
  });
}

export function addConsultingChrome(
  slide: Slide,
  spec: SlideSpec,
  page: number,
  total: number,
) {
  addAccent(slide);
  if (spec.eyebrow) {
    slide.addText(spec.eyebrow, {
      ...textOpts({ fontSize: 10, color: theme.primary, bold: true }),
      x: 0.5,
      y: 0.18,
      w: 12.3,
      h: 0.22,
    });
  }
  slide.addText(spec.headline, {
    ...textOpts({ fontSize: spec.headline.length > 28 ? 18 : 20, bold: true }),
    x: 0.5,
    y: spec.eyebrow ? 0.38 : 0.22,
    w: 12.3,
    h: 0.78,
  });

  const implication = spec.managementImplication || spec.takeaway;
  if (implication) {
    slide.addShape("roundRect", {
      x: 0.5,
      y: 6.42,
      w: 12.3,
      h: 0.62,
      fill: { color: theme.lavender },
      rectRadius: 0.08,
      line: { color: theme.cream },
    });
    slide.addText(implication, {
      ...textOpts({ fontSize: 12, color: theme.primary, bold: true }),
      x: 0.68,
      y: 6.5,
      w: 11.94,
      h: 0.46,
      valign: "middle",
    });
  }

  slide.addText(`${page} / ${total}`, {
    ...textOpts({ fontSize: 10, color: theme.muted, align: "right" }),
    x: 11.2,
    y: 7.12,
    w: 1.6,
    h: 0.22,
  });
  if (spec.speakerNotes) {
    slide.addNotes(spec.speakerNotes);
  }
}

function addCard(
  slide: Slide,
  block: SlideBlock,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { dark?: boolean },
) {
  const dark = options?.dark;
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: dark ? DARK : CARD },
    line: { color: dark ? DARK : LINE },
    rectRadius: 0.08,
  });
  const labelColor = dark ? "E8DEFF" : theme.muted;
  const valueColor = dark ? "FFFFFF" : theme.title;
  const detailColor = dark ? "FFE6C7" : theme.olive;
  slide.addText(block.label, {
    ...textOpts({ fontSize: 11, color: labelColor, bold: true }),
    x: x + 0.16,
    y: y + 0.12,
    w: w - 0.32,
    h: 0.28,
  });
  const badge = statusLabel(block.status);
  if (badge && badge !== (block.value || "待补充")) {
    slide.addText(badge, {
      ...textOpts({ fontSize: 10, color: theme.accent, align: "right" }),
      x: x + w - 1.4,
      y: y + 0.12,
      w: 1.2,
      h: 0.24,
    });
  }
  slide.addText(block.value || "待补充", {
    ...textOpts({ fontSize: h > 1.6 ? 18 : 14, color: valueColor, bold: true }),
    x: x + 0.16,
    y: y + 0.42,
    w: w - 0.32,
    h: h > 1.6 ? 0.5 : 0.4,
  });
  if (block.detail) {
    slide.addText(block.detail, {
      ...textOpts({ fontSize: 11, color: detailColor }),
      x: x + 0.16,
      y: y + (h > 1.6 ? 0.96 : 0.84),
      w: w - 0.32,
      h: Math.max(0.36, h - 1.1),
    });
  }
}

function addMetricBars(slide: Slide, blocks: SlideBlock[], x: number, y: number, w: number, h: number) {
  const numeric = blocks
    .map((block) => ({ block, n: parseBlockNumber(block.value) }))
    .filter((item) => item.n !== null) as { block: SlideBlock; n: number }[];
  if (numeric.length === 0) {
    blocks.slice(0, 4).forEach((block, index) => {
      addCard(slide, block, x, y + index * ((h + 0.12) / Math.max(blocks.length, 1)), w, Math.min(1.35, h / Math.max(blocks.length, 1) - 0.1));
    });
    return;
  }
  const max = Math.max(...numeric.map((item) => Math.abs(item.n)), 1);
  const rowH = Math.min(1.15, (h - 0.1 * (numeric.length - 1)) / numeric.length);
  numeric.forEach((item, index) => {
    const rowY = y + index * (rowH + 0.12);
    slide.addText(item.block.label, {
      ...textOpts({ fontSize: 12, color: theme.muted }),
      x,
      y: rowY,
      w: w,
      h: 0.24,
    });
    const barW = Math.max(0.8, (Math.abs(item.n) / max) * (w - 0.1));
    slide.addShape("roundRect", {
      x,
      y: rowY + 0.28,
      w: barW,
      h: rowH - 0.36,
      fill: { color: index === numeric.length - 1 ? theme.accent : theme.primary },
      rectRadius: 0.06,
    });
    slide.addText(item.block.value, {
      ...textOpts({ fontSize: 11, color: "FFFFFF", bold: true }),
      x: x + 0.12,
      y: rowY + 0.32,
      w: Math.max(1.2, barW - 0.2),
      h: 0.32,
    });
  });
}

function splitLayout(spec: SlideSpec, slide: Slide) {
  const blocks = spec.blocks ?? [];
  const left = blocks.filter((block) => block.kind === "text").slice(0, 2);
  const right = blocks.filter((block) => !left.includes(block)).slice(0, 4);
  const leftBlocks = left.length > 0 ? left : blocks.slice(0, 1);
  const rightBlocks = right.length > 0 ? right : blocks.slice(1, 4);
  leftBlocks.forEach((block, index) => {
    addCard(slide, block, 0.5, 1.28 + index * 2.45, 4.7, 2.3);
  });
  const count = Math.max(rightBlocks.length, 1);
  const cardH = Math.min(2.3, (4.9 - 0.12 * (count - 1)) / count);
  rightBlocks.forEach((block, index) => {
    addCard(slide, block, 5.4, 1.28 + index * (cardH + 0.12), 7.4, cardH);
  });
}

function gridLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 8);
  const count = Math.max(blocks.length, 1);
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const gap = 0.16;
  const w = (12.3 - gap * (cols - 1)) / cols;
  const h = (4.9 - gap * (rows - 1)) / rows;
  blocks.forEach((block, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    addCard(slide, block, 0.5 + col * (w + gap), 1.28 + row * (h + gap), w, h);
  });
}

function chartInsightLayout(spec: SlideSpec, slide: Slide) {
  const blocks = spec.blocks ?? [];
  const chartBlocks = blocks.filter((block) => block.kind === "chart" || block.kind === "metric");
  const insight = blocks.find((block) => block.kind === "text" || block.kind === "risk") ?? blocks[blocks.length - 1];
  addMetricBars(slide, chartBlocks.length > 0 ? chartBlocks : blocks.slice(0, 3), 0.5, 1.28, 7.3, 4.9);
  const insightBlock = insight ?? {
    kind: "text" as const,
    label: "管理含义",
    value: spec.managementImplication || spec.takeaway || "见右侧结论",
    detail: "",
    sourceRef: "",
    status: "confirmed" as const,
  };
  addCard(slide, insightBlock, 8.0, 1.28, 4.8, 4.9, { dark: true });
}

function comparisonLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  const count = Math.max(blocks.length, 1);
  const w = (12.3 - 0.18 * (count - 1)) / count;
  blocks.forEach((block, index) => {
    addCard(slide, block, 0.5 + index * (w + 0.18), 1.28, w, 4.9, { dark: index === blocks.length - 1 && block.kind === "risk" });
  });
}

function timelineLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  slide.addShape("rect", {
    x: 0.78,
    y: 1.45,
    w: 0.06,
    h: 4.6,
    fill: { color: theme.lavender },
  });
  blocks.forEach((block, index) => {
    const y = 1.28 + index * 1.22;
    slide.addShape("ellipse", {
      x: 0.64,
      y: y + 0.38,
      w: 0.34,
      h: 0.34,
      fill: { color: block.kind === "risk" ? theme.accent : theme.primary },
    });
    addCard(slide, block, 1.2, y, 11.6, 1.12);
  });
}

function decisionLayout(spec: SlideSpec, slide: Slide) {
  const actions = (spec.blocks ?? []).filter((block) => block.kind === "action");
  const others = (spec.blocks ?? []).filter((block) => block.kind !== "action");
  const rows = (actions.length > 0 ? actions : spec.blocks ?? []).slice(0, 4);
  rows.forEach((block, index) => {
    addCard(slide, block, 0.5, 1.28 + index * 1.18, others.length > 0 ? 8.2 : 12.3, 1.08);
  });
  others.slice(0, 2).forEach((block, index) => {
    addCard(slide, block, 8.9, 1.28 + index * 2.45, 3.9, 2.3, { dark: block.kind === "risk" });
  });
}

function progressLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  const labels = ["已完成结果", "结果证据", "当前风险", "后续动作"];
  blocks.forEach((block, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const titled = { ...block, label: block.label || labels[index] };
    addCard(slide, titled, 0.5 + col * 6.25, 1.28 + row * 2.5, 6.05, 2.35, { dark: block.kind === "risk" });
  });
}

const LAYOUT_RENDERERS: Record<LayoutId, (spec: SlideSpec, slide: Slide) => void> = {
  executive_summary_split: splitLayout,
  metric_grid: gridLayout,
  chart_plus_insight: chartInsightLayout,
  comparison: comparisonLayout,
  timeline_risk: timelineLayout,
  decision_actions: decisionLayout,
  progress_evidence: progressLayout,
};

export function renderConsultingSlide(
  pres: InstanceType<typeof PptxGenJS>,
  spec: SlideSpec,
  layoutId: LayoutId,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addConsultingChrome(slide, spec, page, total);
  LAYOUT_RENDERERS[layoutId](spec, slide);
}
