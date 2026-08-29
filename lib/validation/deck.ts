import { isFunnelStageFact } from "@/lib/facts/from-brief";
import type { Fact } from "@/lib/presentation/types";
import {
  TEMPLATE_SLIDE_TYPES,
  type DeckSpec,
  type SlideSpec,
  type SlideType,
  type TemplateSlideType,
} from "@/lib/schemas/deck";
import type { Brief } from "@/lib/schemas/brief";
import { FOCUS_LABELS, STATUS_LABELS, hasFunnelStages } from "@/lib/schemas/brief";

export type NormalizeContext = {
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief;
  minSlides?: number;
  maxSlides?: number;
  exactSlides?: number;
};

const DEFAULT_HEADLINES: Record<SlideType, string> = {
  cover: "工作汇报",
  executive_summary: "核心结论",
  funnel: "业务漏斗",
  progress: "当前进度",
  tech_focus: "技术实现",
  diagnosis: "问题与卡点",
  recommendations: "建议",
  action_plan: "行动计划",
  kpi_overview: "关键指标总览",
  trend: "趋势",
  comparison: "对比",
};

const NAKED_NUMBER_RE = /\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:亿|万)?元|\d{2,}(?:\.\d+)?\s*万/g;

export function findNakedNumbers(text: string): string[] {
  const stripped = text.replace(/\{\{[a-z0-9_]+\}\}/g, " ");
  return stripped.match(NAKED_NUMBER_RE) ?? [];
}

export function sanitizeNakedNumbers(text: string): string {
  const placeholders: string[] = [];
  const protectedText = text.replace(/\{\{[a-z0-9_]+\}\}/g, (match) => {
    placeholders.push(match);
    return `__PH${placeholders.length - 1}__`;
  });
  const sanitized = protectedText
    .replace(/\d+(?:\.\d+)?%/g, "相应比例")
    .replace(/\d+(?:\.\d+)?\s*(?:亿|万)?元/g, "相应金额")
    .replace(/\d{2,}(?:\.\d+)?\s*万/g, "相应金额");
  return sanitized.replace(/__PH(\d+)__/g, (_, index: string) => placeholders[Number(index)] ?? "");
}

function clipHeadline(text: string): string {
  const chars = [...text.trim()];
  return chars.length <= 24 ? text.trim() : chars.slice(0, 24).join("");
}

function funnelFactIds(facts: Fact[]) {
  return facts.filter(isFunnelStageFact).map((fact) => fact.id);
}

function progressFactIds(facts: Fact[]) {
  return facts.filter((fact) => fact.id.startsWith("fact_progress_")).map((fact) => fact.id);
}

function progressBullets(brief: Brief) {
  return brief.progress.slice(0, 5).map((item) => {
    const owner = item.owner || "待定";
    const note = item.note || "见原话";
    return `${item.name}｜${STATUS_LABELS[item.status]}｜${owner}｜${note}`;
  });
}

function defaultSlide(type: TemplateSlideType, index: number, facts: Fact[], ctx: NormalizeContext): SlideSpec {
  const funnelRefs = funnelFactIds(facts);
  const progressRefs = progressFactIds(facts);
  const focusText = ctx.brief.focuses.map((focus) => FOCUS_LABELS[focus]).join("、");

  const bullets =
    type === "cover"
      ? [`关注：${focusText}`, `时长：${ctx.durationMinutes} 分钟`]
      : type === "progress"
        ? progressBullets(ctx.brief)
        : type === "funnel"
          ? ctx.brief.funnel.slice(0, 5).map((stage, i) => `${stage.name}：{{fact_funnel_${i + 1}}}`)
          : type === "action_plan"
            ? ctx.brief.progress.slice(0, 5).map((item) => `${item.name}｜${item.owner || "待定"}｜待定`)
            : [];

  const factRefs =
    type === "funnel"
      ? funnelRefs
      : type === "progress" || type === "executive_summary"
        ? [...funnelRefs.slice(0, 2), ...progressRefs.slice(0, 4)]
        : [];

  return {
    id: `s${index + 1}`,
    type,
    headline: type === "cover" ? clipHeadline(ctx.leaderRequest.slice(0, 24) || DEFAULT_HEADLINES.cover) : DEFAULT_HEADLINES[type],
    takeaway:
      type === "cover"
        ? focusText
        : type === "funnel"
          ? "漏斗数字来自填写的阶段"
          : type === "progress"
            ? "进度来自当前事项状态"
            : "",
    bullets,
    factRefs,
    chart: type === "funnel" && funnelRefs.length > 0 ? { type: "bar", factRefs: funnelRefs } : undefined,
    speakerNotes: type === "cover" ? "" : "按已填写的进度和材料讲，不补充未提供的数字。",
    estimatedSeconds: type === "cover" ? 20 : 50,
  };
}

function neededTypes(brief: Brief): TemplateSlideType[] {
  const types: TemplateSlideType[] = ["cover", "executive_summary"];
  if (hasFunnelStages(brief)) {
    types.push("funnel");
  }
  if (brief.focuses.includes("progress") || brief.progress.length > 0) {
    types.push("progress");
  }
  if (brief.focuses.includes("tech")) {
    types.push("tech_focus");
  }
  return types;
}

function withFallbackTakeaway(slide: SlideSpec): SlideSpec {
  if (slide.takeaway || slide.bullets.length > 0) {
    return slide;
  }
  return { ...slide, takeaway: DEFAULT_HEADLINES[slide.type] };
}

function padToCount(slides: SlideSpec[], target: number, facts: Fact[], ctx: NormalizeContext): SlideSpec[] {
  const result = [...slides];
  const have = new Set(result.map((slide) => slide.type));
  const fillTypes = TEMPLATE_SLIDE_TYPES.filter((type) => type !== "cover");

  for (const type of [...neededTypes(ctx.brief), ...fillTypes]) {
    if (result.length >= target) {
      break;
    }
    if (!have.has(type)) {
      result.push(withFallbackTakeaway(defaultSlide(type, result.length, facts, ctx)));
      have.add(type);
    }
  }

  let extra = 0;
  while (result.length < target) {
    const type = fillTypes[extra % fillTypes.length];
    extra += 1;
    result.push(withFallbackTakeaway(defaultSlide(type, result.length, facts, ctx)));
  }

  return result;
}

function cleanSlide(source: SlideSpec, index: number, factIds: Set<string>): SlideSpec {
  const factRefs = [...new Set(source.factRefs.filter((id) => factIds.has(id)))];
  const chartRefs = (source.chart?.factRefs ?? []).filter((id) => factIds.has(id));
  return {
    id: source.id || `s${index + 1}`,
    type: source.type,
    headline: clipHeadline(sanitizeNakedNumbers(source.headline || DEFAULT_HEADLINES[source.type])),
    takeaway: sanitizeNakedNumbers(source.takeaway).trim(),
    bullets: source.bullets
      .map((item) => sanitizeNakedNumbers(item).trim())
      .filter(Boolean)
      .slice(0, 5),
    factRefs,
    chart:
      chartRefs.length > 0
        ? { type: source.chart?.type ?? "bar", factRefs: chartRefs }
        : source.type === "funnel" && factRefs.length > 0
          ? { type: "bar", factRefs }
          : undefined,
    speakerNotes: source.speakerNotes.trim(),
    estimatedSeconds: source.estimatedSeconds || 50,
  };
}

export function defaultDeckFromBrief(facts: Fact[], ctx: NormalizeContext): DeckSpec {
  const types = neededTypes(ctx.brief);
  return {
    title: clipHeadline(ctx.leaderRequest.split("\n")[0] || "工作汇报"),
    subtitle: `${ctx.brief.focuses.map((focus) => FOCUS_LABELS[focus]).join(" · ")} · ${ctx.durationMinutes} 分钟`,
    slides: types.map((type, index) => defaultSlide(type, index, facts, ctx)),
  };
}

export function normalizeDeckSpec(raw: DeckSpec, facts: Fact[], ctx: NormalizeContext): DeckSpec {
  const factIds = new Set(facts.map((fact) => fact.id));
  const maxSlides = ctx.exactSlides ?? ctx.maxSlides ?? 8;

  let slides = raw.slides.map((slide, index) => cleanSlide(slide, index, factIds));
  slides = slides.filter((slide) => {
    if (slide.type === "cover" || slide.type === "progress") {
      return true;
    }
    if (slide.type === "funnel") {
      return hasFunnelStages(ctx.brief) && slide.factRefs.length > 0;
    }
    return Boolean(slide.takeaway || slide.bullets.length > 0);
  });
  if (slides.length === 0) {
    slides = defaultDeckFromBrief(facts, ctx).slides;
  }
  if (!slides.some((slide) => slide.type === "cover")) {
    slides.unshift(defaultSlide("cover", 0, facts, ctx));
  }

  if (ctx.exactSlides && slides.length < ctx.exactSlides) {
    slides = padToCount(slides, ctx.exactSlides, facts, ctx);
  } else if (!ctx.exactSlides) {
    const have = new Set(slides.map((slide) => slide.type));
    neededTypes(ctx.brief).forEach((type) => {
      if (!have.has(type) && slides.length < maxSlides) {
        slides.push(defaultSlide(type, slides.length, facts, ctx));
        have.add(type);
      }
    });
  }

  if (slides.length > maxSlides) {
    const cover = slides.find((slide) => slide.type === "cover");
    const rest = slides.filter((slide) => slide.type !== "cover");
    slides = cover ? [cover, ...rest.slice(0, maxSlides - 1)] : slides.slice(0, maxSlides);
  }

  return {
    title: raw.title.trim() || clipHeadline(ctx.leaderRequest.split("\n")[0] || "工作汇报"),
    subtitle:
      raw.subtitle.trim() ||
      `${ctx.brief.focuses.map((focus) => FOCUS_LABELS[focus]).join(" · ")} · ${ctx.durationMinutes} 分钟`,
    slides: slides.map((slide, index) => ({ ...slide, id: `s${index + 1}` })),
  };
}
