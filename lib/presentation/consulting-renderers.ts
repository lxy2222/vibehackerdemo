import type PptxGenJS from "pptxgenjs";
import { parseBlockNumber, statusLabel } from "@/lib/presentation/blocks";
import { barColor, blockTone, NODE_COLORS, pad2, type BlockTone } from "@/lib/presentation/ppt-style";
import { theme } from "@/lib/presentation/theme";
import type { LayoutId, SlideBlock, SlideSpec } from "@/lib/schemas/deck";

type Slide = ReturnType<InstanceType<typeof PptxGenJS>["addSlide"]>;

const TONE_TEXT: Record<BlockTone, { label: string; value: string; detail: string }> = {
  paper: { label: theme.muted, value: theme.ink, detail: theme.body },
  lime: { label: "2C2A26", value: theme.ink, detail: theme.body },
  sage: { label: "2C2A26", value: theme.ink, detail: "2C2A26" },
  ink: { label: theme.stone, value: theme.white, detail: theme.stone },
};

function textOpts(overrides: Record<string, unknown> = {}) {
  return {
    fontFace: theme.font,
    color: theme.ink,
    margin: 0,
    ...overrides,
  };
}

function addHairline(slide: Slide, x: number, y: number, w: number) {
  slide.addShape("rect", {
    x,
    y,
    w,
    h: 0.012,
    fill: { color: theme.line },
    line: { color: theme.line },
  });
}

export function addConsultingChrome(
  slide: Slide,
  spec: SlideSpec,
  page: number,
  total: number,
) {
  slide.addText(pad2(page), {
    ...textOpts({ fontSize: 10, color: theme.lime, bold: true }),
    x: 0.5,
    y: 0.18,
    w: 0.55,
    h: 0.22,
  });
  if (spec.eyebrow) {
    slide.addText(spec.eyebrow, {
      ...textOpts({ fontSize: 10, color: theme.muted, bold: true }),
      x: 1.05,
      y: 0.18,
      w: 9.4,
      h: 0.22,
    });
  }
  slide.addText(`${pad2(page)} / ${pad2(total)}`, {
    ...textOpts({ fontSize: 10, color: theme.muted, align: "right" }),
    x: 10.6,
    y: 0.18,
    w: 2.2,
    h: 0.22,
  });
  addHairline(slide, 0.5, 0.48, 12.3);
  slide.addText(spec.headline, {
    ...textOpts({ fontSize: spec.headline.length > 28 ? 16 : 18, bold: true }),
    x: 0.5,
    y: 0.58,
    w: 12.3,
    h: 0.7,
  });

  const implication = spec.managementImplication || spec.takeaway;
  if (implication) {
    addHairline(slide, 0.5, 6.48, 12.3);
    slide.addText("→", {
      ...textOpts({ fontSize: 12, color: theme.lime, bold: true }),
      x: 0.5,
      y: 6.58,
      w: 0.32,
      h: 0.42,
    });
    slide.addText(implication, {
      ...textOpts({ fontSize: 12, color: theme.ink, bold: true }),
      x: 0.86,
      y: 6.58,
      w: 11.94,
      h: 0.42,
      valign: "middle",
    });
  }
  if (spec.speakerNotes) {
    slide.addNotes(spec.speakerNotes);
  }
}

function addBlock(
  slide: Slide,
  block: SlideBlock,
  x: number,
  y: number,
  w: number,
  h: number,
  tone: BlockTone,
) {
  const colors = TONE_TEXT[tone];
  const fill = tone === "paper" ? theme.paper : tone === "lime" ? theme.lime : tone === "sage" ? theme.sage : theme.ink;
  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: tone === "paper" ? theme.line : fill },
  });
  slide.addText(block.label, {
    ...textOpts({ fontSize: 10, color: colors.label, bold: true }),
    x: x + 0.16,
    y: y + 0.12,
    w: w - 0.32,
    h: 0.24,
  });
  const badge = statusLabel(block.status);
  if (badge && badge !== (block.value || "待补充")) {
    slide.addText(badge, {
      ...textOpts({ fontSize: 9, color: theme.lime, align: "right", bold: true }),
      x: x + w - 1.5,
      y: y + 0.12,
      w: 1.3,
      h: 0.22,
    });
  }
  slide.addText(block.value || "待补充", {
    ...textOpts({ fontSize: h > 1.6 ? 18 : 14, color: colors.value, bold: true }),
    x: x + 0.16,
    y: y + 0.4,
    w: w - 0.32,
    h: h > 1.6 ? 0.5 : 0.38,
  });
  if (block.detail) {
    slide.addText(block.detail, {
      ...textOpts({ fontSize: 11, color: colors.detail }),
      x: x + 0.16,
      y: y + (h > 1.6 ? 0.94 : 0.8),
      w: w - 0.32,
      h: Math.max(0.32, h - 1.05),
    });
  }
}

function addMetricBars(slide: Slide, blocks: SlideBlock[], x: number, y: number, w: number, h: number) {
  const numeric = blocks
    .map((block) => ({ block, n: parseBlockNumber(block.value) }))
    .filter((item) => item.n !== null) as { block: SlideBlock; n: number }[];
  if (numeric.length === 0) {
    blocks.slice(0, 4).forEach((block, index) => {
      const rowH = h / Math.max(blocks.length, 1);
      addHairlineRow(slide, block, index, x, y + index * rowH, w, rowH);
    });
    return;
  }
  const max = Math.max(...numeric.map((item) => Math.abs(item.n)), 1);
  const rowH = h / numeric.length;
  numeric.forEach((item, index) => {
    const rowY = y + index * rowH;
    slide.addText(item.block.label, {
      ...textOpts({ fontSize: 11, color: theme.muted }),
      x,
      y: rowY + 0.08,
      w: w * 0.7,
      h: 0.24,
    });
    slide.addText(item.block.value, {
      ...textOpts({ fontSize: 12, color: theme.ink, bold: true, align: "right" }),
      x: x + w * 0.55,
      y: rowY + 0.08,
      w: w * 0.45,
      h: 0.24,
    });
    const trackH = 0.18;
    slide.addShape("rect", {
      x,
      y: rowY + 0.4,
      w,
      h: trackH,
      fill: { color: theme.paperAlt },
      line: { color: theme.paperAlt },
    });
    const barW = Math.max(0.5, (Math.abs(item.n) / max) * w);
    const fill = barColor(index, numeric.length);
    slide.addShape("rect", {
      x,
      y: rowY + 0.4,
      w: barW,
      h: trackH,
      fill: { color: fill },
      line: { color: fill },
    });
  });
}

function addHairlineRow(
  slide: Slide,
  block: SlideBlock,
  index: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  slide.addText(`${pad2(index + 1)}  ${block.label}`, {
    ...textOpts({ fontSize: 10, color: theme.muted, bold: true }),
    x,
    y: y + 0.08,
    w,
    h: 0.22,
  });
  slide.addText(block.value || "待补充", {
    ...textOpts({ fontSize: 13, color: theme.ink, bold: true }),
    x,
    y: y + 0.32,
    w,
    h: 0.32,
  });
  if (block.detail) {
    slide.addText(block.detail, {
      ...textOpts({ fontSize: 11, color: theme.body }),
      x,
      y: y + 0.66,
      w,
      h: Math.max(0.28, h - 0.78),
    });
  }
  addHairline(slide, x, y + h - 0.02, w);
}

function splitLayout(spec: SlideSpec, slide: Slide) {
  const blocks = spec.blocks ?? [];
  const left = blocks.filter((block) => block.kind === "text").slice(0, 2);
  const right = blocks.filter((block) => !left.includes(block)).slice(0, 4);
  const leftBlocks = left.length > 0 ? left : blocks.slice(0, 1);
  const rightBlocks = right.length > 0 ? right : blocks.slice(1, 4);
  slide.addShape("rect", {
    x: 0.5,
    y: 1.4,
    w: 5.15,
    h: 4.9,
    fill: { color: theme.sage },
    line: { color: theme.sage },
  });
  leftBlocks.forEach((block, index) => {
    const y = 1.58 + index * 2.3;
    slide.addText(block.label, {
      ...textOpts({ fontSize: 10, color: "2C2A26", bold: true }),
      x: 0.74,
      y,
      w: 4.7,
      h: 0.24,
    });
    slide.addText(block.value || "待补充", {
      ...textOpts({ fontSize: 16, color: theme.ink, bold: true }),
      x: 0.74,
      y: y + 0.32,
      w: 4.7,
      h: 0.7,
    });
    if (block.detail) {
      slide.addText(block.detail, {
        ...textOpts({ fontSize: 12, color: "2C2A26" }),
        x: 0.74,
        y: y + 1.08,
        w: 4.7,
        h: 0.9,
      });
    }
  });
  rightBlocks.forEach((block, index) => {
    addHairlineRow(slide, block, index, 5.9, 1.4 + index * (4.9 / Math.max(rightBlocks.length, 1)), 6.9, 4.9 / Math.max(rightBlocks.length, 1));
  });
}

function gridLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 8);
  const count = Math.max(blocks.length, 1);
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const w = 12.3 / cols;
  const h = 4.9 / rows;
  blocks.forEach((block, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    addBlock(slide, block, 0.5 + col * w, 1.4 + row * h, w, h, blockTone(block, index));
  });
}

function chartInsightLayout(spec: SlideSpec, slide: Slide) {
  const blocks = spec.blocks ?? [];
  const chartBlocks = blocks.filter((block) => block.kind === "chart" || block.kind === "metric");
  const insight = blocks.find((block) => block.kind === "text" || block.kind === "risk") ?? blocks[blocks.length - 1];
  addMetricBars(slide, chartBlocks.length > 0 ? chartBlocks : blocks.slice(0, 3), 0.5, 1.4, 7.4, 4.9);
  const insightBlock = insight ?? {
    kind: "text" as const,
    label: "管理含义",
    value: spec.managementImplication || spec.takeaway || "见右侧结论",
    detail: "",
    sourceRef: "",
    status: "confirmed" as const,
  };
  addBlock(slide, insightBlock, 8.15, 1.4, 4.65, 4.9, "ink");
}

function comparisonLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  const count = Math.max(blocks.length, 1);
  const w = 12.3 / count;
  blocks.forEach((block, index) => {
    const tone: BlockTone =
      block.kind === "risk" ? "ink" : index === blocks.length - 1 ? "lime" : index === 0 ? "sage" : "paper";
    addBlock(slide, block, 0.5 + index * w, 1.4, w, 4.9, tone);
  });
}

function timelineLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  const n = Math.max(blocks.length, 1);
  const startX = 0.62;
  const usable = 12.1;
  const step = n === 1 ? 0 : usable / n;
  slide.addShape("rect", {
    x: startX + 0.12,
    y: 1.66,
    w: Math.max(0.2, usable - step + 0.2),
    h: 0.014,
    fill: { color: theme.line },
    line: { color: theme.line },
  });
  blocks.forEach((block, index) => {
    const cx = startX + index * (usable / n);
    const color = NODE_COLORS[index % NODE_COLORS.length];
    slide.addShape("ellipse", {
      x: cx,
      y: 1.52,
      w: 0.3,
      h: 0.3,
      fill: { color },
      line: { color },
    });
    const colX = 0.5 + index * (12.3 / n);
    const colW = 12.3 / n - 0.16;
    slide.addText(pad2(index + 1), {
      ...textOpts({ fontSize: 10, color: theme.muted, bold: true }),
      x: colX,
      y: 2.05,
      w: colW,
      h: 0.24,
    });
    slide.addText(block.label, {
      ...textOpts({ fontSize: 11, color: theme.muted }),
      x: colX,
      y: 2.32,
      w: colW,
      h: 0.28,
    });
    slide.addText(block.value || "待补充", {
      ...textOpts({ fontSize: 14, color: theme.ink, bold: true }),
      x: colX,
      y: 2.64,
      w: colW,
      h: 0.7,
    });
    if (block.detail) {
      slide.addText(block.detail, {
        ...textOpts({ fontSize: 12, color: theme.body }),
        x: colX,
        y: 3.4,
        w: colW,
        h: 2.6,
      });
    }
  });
}

function decisionLayout(spec: SlideSpec, slide: Slide) {
  const actions = (spec.blocks ?? []).filter((block) => block.kind === "action");
  const others = (spec.blocks ?? []).filter((block) => block.kind !== "action");
  const rows = (actions.length > 0 ? actions : spec.blocks ?? []).slice(0, 4);
  const leftW = others.length > 0 ? 8.15 : 12.3;
  const rowH = 4.9 / Math.max(rows.length, 1);
  rows.forEach((block, index) => {
    const y = 1.4 + index * rowH;
    slide.addText(pad2(index + 1), {
      ...textOpts({ fontSize: 12, color: theme.lime, bold: true }),
      x: 0.5,
      y: y + 0.16,
      w: 0.5,
      h: 0.28,
    });
    slide.addText(block.label, {
      ...textOpts({ fontSize: 10, color: theme.muted, bold: true }),
      x: 1.1,
      y: y + 0.1,
      w: leftW - 0.8,
      h: 0.22,
    });
    slide.addText(block.value || "待补充", {
      ...textOpts({ fontSize: 14, color: theme.ink, bold: true }),
      x: 1.1,
      y: y + 0.34,
      w: leftW - 0.8,
      h: 0.32,
    });
    if (block.detail) {
      slide.addText(block.detail, {
        ...textOpts({ fontSize: 11, color: theme.body }),
        x: 1.1,
        y: y + 0.68,
        w: leftW - 0.8,
        h: Math.max(0.28, rowH - 0.82),
      });
    }
    addHairline(slide, 0.5, y + rowH - 0.02, leftW);
  });
  others.slice(0, 2).forEach((block, index) => {
    addBlock(slide, block, 8.85, 1.4 + index * 2.45, 3.95, 2.45, block.kind === "risk" ? "ink" : "lime");
  });
}

function progressLayout(spec: SlideSpec, slide: Slide) {
  const blocks = (spec.blocks ?? []).slice(0, 4);
  const tones: BlockTone[] = ["lime", "paper", "ink", "sage"];
  blocks.forEach((block, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const tone: BlockTone = block.kind === "risk" ? "ink" : block.status === "missing" ? "lime" : tones[index];
    addBlock(slide, block, 0.5 + col * 6.15, 1.4 + row * 2.45, 6.15, 2.45, tone);
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
