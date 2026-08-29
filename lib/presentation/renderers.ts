import type PptxGenJS from "pptxgenjs";
import {
  barPointsFromFacts,
  footerSource,
  lineSeriesFromFacts,
} from "@/lib/presentation/charts";
import {
  factMap,
  formatFactValue,
  interpolate,
  resolveFacts,
} from "@/lib/presentation/facts";
import { theme } from "@/lib/presentation/theme";
import { isFunnelStageFact } from "@/lib/facts/from-brief";
import type { DeckSpec, Fact, SlideSpec } from "@/lib/presentation/types";

type Pres = InstanceType<typeof PptxGenJS>;
type Slide = ReturnType<Pres["addSlide"]>;

const CHART_COLORS = [
  theme.primary,
  theme.accent,
  theme.secondary,
  theme.muted,
];

function textOpts(overrides: Record<string, unknown> = {}) {
  return {
    fontFace: theme.font,
    color: theme.title,
    margin: 0,
    ...overrides,
  };
}

function addFooter(slide: Slide, source: string, page: number, total: number) {
  slide.addText(source, {
    ...textOpts({ color: theme.muted, fontSize: 10 }),
    x: 0.5,
    y: 7.12,
    w: 10.5,
    h: 0.22,
  });
  slide.addText(`${page} / ${total}`, {
    ...textOpts({ color: theme.muted, fontSize: 10, align: "right" }),
    x: 11.2,
    y: 7.12,
    w: 1.6,
    h: 0.22,
  });
}

function addHeadline(slide: Slide, spec: SlideSpec, facts: Map<string, Fact>) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.12,
    h: 7.5,
    fill: { color: theme.primary },
    line: { color: theme.primary },
  });
  slide.addText(interpolate(spec.headline, facts), {
    ...textOpts({ fontSize: 22, bold: true }),
    x: 0.5,
    y: 0.28,
    w: 12.3,
    h: 0.45,
  });
}

function addTakeaway(slide: Slide, spec: SlideSpec, facts: Map<string, Fact>) {
  slide.addShape("roundRect", {
    x: 0.5,
    y: 0.82,
    w: 12.3,
    h: 0.72,
    fill: { color: "F3FBFA" },
    rectRadius: 0.08,
    line: { color: "D7EDEA" },
  });
  slide.addText(interpolate(spec.takeaway, facts), {
    ...textOpts({ fontSize: 14, color: theme.primary, bold: true }),
    x: 0.7,
    y: 0.9,
    w: 11.9,
    h: 0.56,
    valign: "middle",
  });
}

function addMissingPlaceholder(slide: Slide) {
  slide.addShape("roundRect", {
    x: 0.5,
    y: 1.8,
    w: 12.3,
    h: 4.8,
    fill: { color: "F7F7F8" },
    rectRadius: 0.1,
    line: { color: "E4E4E7" },
  });
  slide.addText("资料未提供", {
    ...textOpts({ fontSize: 28, color: theme.muted, align: "center" }),
    x: 0.5,
    y: 3.4,
    w: 12.3,
    h: 0.6,
  });
  slide.addText("填写漏斗或进度后，本页会显示对应内容。", {
    ...textOpts({ fontSize: 13, color: theme.body, align: "center" }),
    x: 0.5,
    y: 4.05,
    w: 12.3,
    h: 0.4,
  });
}

function renderCover(pres: Pres, spec: SlideSpec, deck: DeckSpec) {
  const slide = pres.addSlide();
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: theme.bg },
  });
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.28,
    h: 7.5,
    fill: { color: theme.primary },
  });
  slide.addText("工作汇报", {
    ...textOpts({ fontSize: 14, color: theme.primary, bold: true }),
    x: 0.9,
    y: 2.15,
    w: 11,
    h: 0.35,
  });
  slide.addText(spec.headline, {
    ...textOpts({ fontSize: 40, bold: true }),
    x: 0.9,
    y: 2.55,
    w: 11.5,
    h: 0.9,
  });
  slide.addText(spec.takeaway, {
    ...textOpts({ fontSize: 20, color: theme.accent }),
    x: 0.9,
    y: 3.5,
    w: 11.5,
    h: 0.45,
  });
  slide.addText(deck.subtitle, {
    ...textOpts({ fontSize: 16, color: theme.body }),
    x: 0.9,
    y: 4.15,
    w: 11.5,
    h: 0.4,
  });
  slide.addText(spec.bullets.join("  ·  "), {
    ...textOpts({ fontSize: 13, color: theme.muted }),
    x: 0.9,
    y: 6.55,
    w: 11.5,
    h: 0.35,
  });
}

function renderBullets(
  slide: Slide,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  y = 1.75,
) {
  slide.addText(
    spec.bullets.map((bullet) => ({
      text: interpolate(bullet, facts),
      options: { bullet: true, breakLine: true },
    })),
    {
      ...textOpts({ fontSize: 16, color: theme.body }),
      x: 0.6,
      y,
      w: 12.1,
      h: 4.8,
      paraSpaceAfter: 10,
    },
  );
}

function renderExecutiveSummary(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);
  renderBullets(slide, spec, facts, 1.75);
  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "领导要求、会议纪要、业务数据"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderKpiOverview(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const resolved = resolveFacts(spec.factRefs, facts).filter(
    (fact) => typeof fact.value === "number",
  );
  if (resolved.length === 0) {
    addMissingPlaceholder(slide);
    addFooter(slide, "来源：资料未提供", page, total);
    if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
    return;
  }

  const cards = resolved.slice(0, 4);
  cards.forEach((fact, index) => {
    const x = 0.5 + index * 3.15;
    slide.addShape("roundRect", {
      x,
      y: 2.1,
      w: 3.0,
      h: 3.6,
      fill: { color: "FFFFFF" },
      line: { color: "E4E4E7" },
      rectRadius: 0.1,
    });
    slide.addText(fact.label, {
      ...textOpts({ fontSize: 13, color: theme.muted }),
      x: x + 0.2,
      y: 2.35,
      w: 2.6,
      h: 0.45,
    });
    slide.addText(formatFactValue(fact), {
      ...textOpts({ fontSize: 22, bold: true }),
      x: x + 0.2,
      y: 3.1,
      w: 2.6,
      h: 0.7,
    });
    if (fact.period) {
      slide.addText(fact.period, {
        ...textOpts({ fontSize: 13, color: theme.primary }),
        x: x + 0.2,
        y: 4.0,
        w: 2.6,
        h: 0.4,
      });
    }
  });

  addFooter(slide, footerSource(resolved), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderTrend(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const selected = resolveFacts(spec.chart?.factRefs ?? spec.factRefs, facts);
  const series = lineSeriesFromFacts(selected);
  const hasData = series.some((item) => item.values.some((value) => value !== 0));
  if (!hasData) {
    addMissingPlaceholder(slide);
    addFooter(slide, "来源：资料未提供", page, total);
    if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
    return;
  }

  slide.addChart(pres.ChartType.line, series, {
    x: 0.5,
    y: 1.75,
    w: 12.3,
    h: 5.0,
    showLegend: true,
    legendPos: "b",
    lineDataSymbol: "circle",
    chartColors: [...CHART_COLORS],
    chartColorsOpacity: 100,
    valAxisMinVal: 0,
    showValue: false,
    fontFace: theme.font,
    chartArea: { fill: { color: theme.bg } },
  });

  addFooter(slide, footerSource(selected), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderComparison(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const selected = resolveFacts(spec.chart?.factRefs ?? spec.factRefs, facts);
  const points = barPointsFromFacts(selected);
  if (points.values.length === 0) {
    addMissingPlaceholder(slide);
    addFooter(slide, "来源：资料未提供", page, total);
    if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
    return;
  }

  slide.addChart(
    pres.ChartType.bar,
    [{ name: selected[0]?.label ?? "对比", labels: points.labels, values: points.values }],
    {
      x: 0.5,
      y: 1.75,
      w: 12.3,
      h: 5.0,
      barDir: "bar",
      showLegend: false,
      showValue: true,
      chartColors: [theme.primary],
      fontFace: theme.font,
      valAxisMinVal: 0,
      chartArea: { fill: { color: theme.bg } },
    },
  );

  addFooter(slide, footerSource(selected), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderFunnel(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const stages = resolveFacts(spec.chart?.factRefs ?? spec.factRefs, facts).filter(isFunnelStageFact);
  if (stages.length === 0) {
    addMissingPlaceholder(slide);
    addFooter(slide, "来源：漏斗表单", page, total);
    if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
    return;
  }

  const max = Math.max(...stages.map((fact) => (typeof fact.value === "number" ? fact.value : 0)), 1);
  stages.forEach((fact, index) => {
    const value = typeof fact.value === "number" ? fact.value : 0;
    const width = 4 + (value / max) * 8.3;
    const x = 0.5 + (12.3 - width) / 2;
    const y = 1.78 + index * 1.05;
    slide.addShape("roundRect", {
      x,
      y,
      w: width,
      h: 0.88,
      fill: { color: index === 0 ? theme.primary : index === stages.length - 1 ? theme.accent : "1AA38C" },
      line: { color: "FFFFFF" },
      rectRadius: 0.08,
    });
    slide.addText(`${fact.label}  ${formatFactValue(fact)}`, {
      ...textOpts({ fontSize: 14, color: "FFFFFF", bold: true, align: "center" }),
      x,
      y: y + 0.18,
      w: width,
      h: 0.52,
    });
  });

  addFooter(slide, footerSource(stages, "漏斗表单"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderProgress(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const rows = [
    [
      { text: "事项", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
      { text: "状态", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
      { text: "负责人", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
      { text: "说明", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
    ],
    ...spec.bullets.map((bullet) => {
      const [name, status, owner, note] = interpolate(bullet, facts)
        .split("｜")
        .map((part) => part.trim());
      return [
        { text: name ?? bullet },
        { text: status ?? "进行中" },
        { text: owner ?? "待定" },
        { text: note ?? "" },
      ];
    }),
  ];

  if (spec.bullets.length === 0) {
    addMissingPlaceholder(slide);
  } else {
    slide.addTable(rows, {
      x: 0.5,
      y: 1.8,
      w: 12.3,
      colW: [3.4, 1.8, 2.2, 4.9],
      border: { pt: 0.5, color: "E4E4E7" },
      color: theme.body,
      fontFace: theme.font,
      fontSize: 13,
      valign: "middle",
      align: "left",
    });
  }

  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "进度表单"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderTechFocus(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);
  renderBullets(slide, spec, facts, 1.75);
  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "汇报原话"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderDiagnosis(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);
  renderBullets(slide, spec, facts, 1.75);
  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "会议纪要"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderRecommendations(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);
  renderBullets(slide, spec, facts, 1.75);
  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "纪要待拍板事项"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

function renderActionPlan(
  pres: Pres,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  page: number,
  total: number,
) {
  const slide = pres.addSlide({ masterName: "CONTENT" });
  addHeadline(slide, spec, facts);
  addTakeaway(slide, spec, facts);

  const rows = [
    [
      { text: "行动", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
      { text: "负责人", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
      { text: "截止", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary } } },
    ],
    ...spec.bullets.map((bullet) => {
      const [action, owner, due] = interpolate(bullet, facts)
        .split("｜")
        .map((part) => part.trim());
      return [
        { text: action ?? bullet },
        { text: owner ?? "待定" },
        { text: due ?? "待定" },
      ];
    }),
  ];

  slide.addTable(rows, {
    x: 0.5,
    y: 1.8,
    w: 12.3,
    colW: [7.3, 2.8, 2.2],
    border: { pt: 0.5, color: "E4E4E7" },
    color: theme.body,
    fontFace: theme.font,
    fontSize: 14,
    valign: "middle",
    align: "left",
  });

  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "会议纪要待拍板事项"), page, total);
  if (spec.speakerNotes) slide.addNotes(spec.speakerNotes);
}

export function renderDeck(pres: Pres, spec: DeckSpec, facts: Fact[]) {
  const factsById = factMap(facts);
  const total = spec.slides.length;

  spec.slides.forEach((slide, index) => {
    const page = index + 1;
    switch (slide.type) {
      case "cover":
        renderCover(pres, slide, spec);
        break;
      case "executive_summary":
        renderExecutiveSummary(pres, slide, factsById, page, total);
        break;
      case "funnel":
        renderFunnel(pres, slide, factsById, page, total);
        break;
      case "progress":
        renderProgress(pres, slide, factsById, page, total);
        break;
      case "tech_focus":
        renderTechFocus(pres, slide, factsById, page, total);
        break;
      case "kpi_overview":
        renderKpiOverview(pres, slide, factsById, page, total);
        break;
      case "trend":
        renderTrend(pres, slide, factsById, page, total);
        break;
      case "comparison":
        renderComparison(pres, slide, factsById, page, total);
        break;
      case "diagnosis":
        renderDiagnosis(pres, slide, factsById, page, total);
        break;
      case "recommendations":
        renderRecommendations(pres, slide, factsById, page, total);
        break;
      case "action_plan":
        renderActionPlan(pres, slide, factsById, page, total);
        break;
    }
  });
}
