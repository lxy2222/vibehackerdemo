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
import { pad2 } from "@/lib/presentation/ppt-style";
import { theme } from "@/lib/presentation/theme";
import { isFunnelStageFact } from "@/lib/facts/from-brief";
import { isConsultingLayout, type LayoutId } from "@/lib/schemas/deck";
import { renderConsultingSlide } from "@/lib/presentation/consulting-renderers";
import type { DeckSpec, Fact, SlideSpec } from "@/lib/presentation/types";

type Pres = InstanceType<typeof PptxGenJS>;
type Slide = ReturnType<Pres["addSlide"]>;

const CHART_COLORS = [theme.lime, theme.sage, theme.ink, theme.stone];

function textOpts(overrides: Record<string, unknown> = {}) {
  return {
    fontFace: theme.font,
    color: theme.ink,
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
  slide.addText(`${pad2(page)} / ${pad2(total)}`, {
    ...textOpts({ color: theme.muted, fontSize: 10, align: "right" }),
    x: 11.2,
    y: 7.12,
    w: 1.6,
    h: 0.22,
  });
}

function addHeadline(slide: Slide, spec: SlideSpec, facts: Map<string, Fact>) {
  slide.addShape("rect", {
    x: 0.5,
    y: 0.28,
    w: 12.3,
    h: 0.012,
    fill: { color: theme.line },
    line: { color: theme.line },
  });
  slide.addText(interpolate(spec.headline, facts), {
    ...textOpts({ fontSize: 20, bold: true }),
    x: 0.5,
    y: 0.4,
    w: 12.3,
    h: 0.5,
  });
}

function addTakeaway(slide: Slide, spec: SlideSpec, facts: Map<string, Fact>) {
  slide.addText("→", {
    ...textOpts({ fontSize: 14, color: theme.lime, bold: true }),
    x: 0.5,
    y: 0.96,
    w: 0.32,
    h: 0.4,
  });
  slide.addText(interpolate(spec.takeaway, facts), {
    ...textOpts({ fontSize: 14, color: theme.ink, bold: true }),
    x: 0.86,
    y: 0.96,
    w: 11.94,
    h: 0.4,
    valign: "middle",
  });
}

function addMissingPlaceholder(slide: Slide) {
  slide.addShape("rect", {
    x: 0.5,
    y: 1.8,
    w: 12.3,
    h: 4.8,
    fill: { color: theme.paperAlt },
    line: { color: theme.line },
  });
  slide.addText("资料未提供", {
    ...textOpts({ fontSize: 28, color: theme.ink, align: "center" }),
    x: 0.5,
    y: 3.4,
    w: 12.3,
    h: 0.6,
  });
  slide.addText("填写进度后，本页会显示对应内容。", {
    ...textOpts({ fontSize: 13, color: theme.muted, align: "center" }),
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
    fill: { color: theme.ink },
  });
  slide.addShape("rect", {
    x: 0.7,
    y: 0.58,
    w: 0.18,
    h: 0.18,
    fill: { color: theme.lime },
    line: { color: theme.lime },
  });
  slide.addText(spec.eyebrow || "MANAGEMENT BRIEFING", {
    ...textOpts({ fontSize: 12, color: theme.lime, bold: true }),
    x: 1.04,
    y: 0.5,
    w: 11.4,
    h: 0.32,
  });
  slide.addText(spec.headline, {
    ...textOpts({ fontSize: spec.headline.length > 16 ? 32 : 40, color: theme.white, bold: true }),
    x: 0.7,
    y: 2.2,
    w: 11.9,
    h: 1.5,
  });
  slide.addShape("rect", {
    x: 0.7,
    y: 3.9,
    w: 1.15,
    h: 0.06,
    fill: { color: theme.lime },
    line: { color: theme.lime },
  });
  slide.addText(spec.takeaway, {
    ...textOpts({ fontSize: 16, color: theme.sage }),
    x: 0.7,
    y: 4.2,
    w: 11.9,
    h: 0.7,
  });
  slide.addText(deck.subtitle, {
    ...textOpts({ fontSize: 13, color: theme.stone }),
    x: 0.7,
    y: 4.95,
    w: 11.9,
    h: 0.35,
  });
  slide.addText(spec.bullets.join("  ·  "), {
    ...textOpts({ fontSize: 12, color: theme.stone }),
    x: 0.7,
    y: 6.85,
    w: 9.6,
    h: 0.32,
  });
  slide.addText("01", {
    ...textOpts({ fontSize: 12, color: theme.lime, align: "right", bold: true }),
    x: 10.6,
    y: 6.85,
    w: 2,
    h: 0.32,
  });
}

function renderBullets(
  slide: Slide,
  spec: SlideSpec,
  facts: Map<string, Fact>,
  y = 1.68,
) {
  const count = spec.bullets.length;
  const fontSize = count > 10 ? 12 : count > 6 ? 13 : 15;
  const paraSpaceAfter = count > 10 ? 3 : count > 6 ? 5 : 8;
  slide.addText(
    spec.bullets.map((bullet) => ({
      text: interpolate(bullet, facts),
      options: { bullet: true, breakLine: true },
    })),
    {
      ...textOpts({ fontSize, color: theme.body }),
      x: 0.6,
      y,
      w: 12.1,
      h: 6.95 - y,
      paraSpaceAfter,
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
    slide.addShape("rect", {
      x,
      y: 2.1,
      w: 3.0,
      h: 3.6,
      fill: { color: index === 0 ? theme.lime : index === cards.length - 1 ? theme.ink : theme.white },
      line: { color: index === 0 ? theme.lime : index === cards.length - 1 ? theme.ink : theme.line },
    });
    const onDark = index === cards.length - 1;
    const onLime = index === 0;
    slide.addText(fact.label, {
      ...textOpts({ fontSize: 13, color: onDark ? theme.stone : onLime ? theme.ink : theme.muted }),
      x: x + 0.2,
      y: 2.35,
      w: 2.6,
      h: 0.45,
    });
    slide.addText(formatFactValue(fact), {
      ...textOpts({ fontSize: 22, bold: true, color: onDark ? theme.white : theme.ink }),
      x: x + 0.2,
      y: 3.1,
      w: 2.6,
      h: 0.7,
    });
    if (fact.period) {
      slide.addText(fact.period, {
        ...textOpts({ fontSize: 13, color: onDark ? theme.lime : theme.sageDeep }),
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
      chartColors: [theme.lime],
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
    slide.addShape("rect", {
      x,
      y,
      w: width,
      h: 0.88,
      fill: { color: index === 0 ? theme.lime : index === stages.length - 1 ? theme.ink : theme.sage },
      line: { color: theme.paper },
    });
    slide.addText(`${fact.label}  ${formatFactValue(fact)}`, {
      ...textOpts({
        fontSize: 14,
        color: index === stages.length - 1 ? theme.white : theme.ink,
        bold: true,
        align: "center",
      }),
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
      { text: "事项", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
      { text: "状态", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
      { text: "负责人", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
      { text: "说明", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
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
      border: { pt: 0.5, color: theme.line },
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
  addFooter(slide, footerSource(resolveFacts(spec.factRefs, facts), "汇报背景"), page, total);
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
      { text: "行动", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
      { text: "负责人", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
      { text: "截止", options: { bold: true, color: theme.white, fill: { color: theme.ink } } },
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
    border: { pt: 0.5, color: theme.line },
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
    const layoutId: LayoutId | null =
      slide.type === "cover"
        ? null
        : slide.layoutId ??
          (isConsultingLayout(slide.type) && (slide.blocks?.length ?? 0) > 0 ? slide.type : null);
    if (layoutId) {
      renderConsultingSlide(pres, slide, layoutId, page, total);
      return;
    }
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
