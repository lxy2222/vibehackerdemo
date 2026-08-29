import { z } from "zod";

export const TEMPLATE_SLIDE_TYPES = [
  "cover",
  "executive_summary",
  "funnel",
  "progress",
  "tech_focus",
  "diagnosis",
  "recommendations",
  "action_plan",
] as const;

export const CONSULTING_LAYOUTS = [
  "executive_summary_split",
  "metric_grid",
  "chart_plus_insight",
  "comparison",
  "timeline_risk",
  "decision_actions",
  "progress_evidence",
] as const;

export const SLIDE_TYPES = [
  ...TEMPLATE_SLIDE_TYPES,
  "kpi_overview",
  "trend",
  "comparison",
  ...CONSULTING_LAYOUTS.filter((layout) => layout !== "comparison"),
] as const;

export const BLOCK_KINDS = ["metric", "text", "chart", "comparison", "risk", "action"] as const;
export const BLOCK_STATUSES = ["confirmed", "estimated", "missing"] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];
export type TemplateSlideType = (typeof TEMPLATE_SLIDE_TYPES)[number];
export type LayoutId = (typeof CONSULTING_LAYOUTS)[number];
export type BlockKind = (typeof BLOCK_KINDS)[number];
export type BlockStatus = (typeof BLOCK_STATUSES)[number];

export const LAYOUT_LABELS: Record<LayoutId, string> = {
  executive_summary_split: "背景与发现",
  metric_grid: "指标卡片",
  chart_plus_insight: "图表与洞察",
  comparison: "对比",
  timeline_risk: "节点与风险",
  decision_actions: "决策与行动",
  progress_evidence: "进展与证据",
};

export const chartSpecSchema = z.object({
  type: z.enum(["bar", "line", "bar_horizontal"]),
  factRefs: z.array(z.string()).catch([]),
});

export const slideBlockSchema = z.object({
  kind: z.enum(BLOCK_KINDS).catch("text"),
  label: z.string().catch(""),
  value: z.string().catch(""),
  detail: z.string().catch(""),
  sourceRef: z.string().catch(""),
  status: z.enum(BLOCK_STATUSES).catch("confirmed"),
});

const layoutIdSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim().toLowerCase();
}, z.enum(CONSULTING_LAYOUTS).catch("progress_evidence"));

export const consultingSlideSchema = z.object({
  slideType: z.string().catch("content"),
  layoutId: layoutIdSchema,
  eyebrow: z.string().catch(""),
  headline: z.string().catch(""),
  blocks: z.array(slideBlockSchema).catch([]),
  managementImplication: z.string().catch(""),
  speakerNotes: z.string().catch(""),
});

export const consultingDeckSchema = z.object({
  deckTitle: z.string().trim().min(1),
  audience: z.string().catch(""),
  reportGoal: z.string().catch(""),
  slides: z.array(consultingSlideSchema).min(1),
});

export const slideSpecSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SLIDE_TYPES),
  layoutId: z.enum(CONSULTING_LAYOUTS).optional(),
  eyebrow: z.string().optional(),
  headline: z.string().catch(""),
  takeaway: z.string().catch(""),
  bullets: z.array(z.string()).catch([]),
  blocks: z.array(slideBlockSchema).optional(),
  managementImplication: z.string().optional(),
  factRefs: z.array(z.string()).catch([]),
  chart: chartSpecSchema.optional(),
  speakerNotes: z.string().catch(""),
  estimatedSeconds: z.coerce.number().catch(50),
});

export const deckSpecSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().catch(""),
  audience: z.string().optional(),
  reportGoal: z.string().optional(),
  slides: z.array(slideSpecSchema).min(1),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type ConsultingSlide = z.infer<typeof consultingSlideSchema>;
export type ConsultingDeck = z.infer<typeof consultingDeckSchema>;
export type SlideSpec = z.infer<typeof slideSpecSchema>;
export type DeckSpec = z.infer<typeof deckSpecSchema>;

export function isConsultingLayout(type: string): type is LayoutId {
  return (CONSULTING_LAYOUTS as readonly string[]).includes(type);
}
