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

export const SLIDE_TYPES = [
  ...TEMPLATE_SLIDE_TYPES,
  "kpi_overview",
  "trend",
  "comparison",
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];
export type TemplateSlideType = (typeof TEMPLATE_SLIDE_TYPES)[number];

export const chartSpecSchema = z.object({
  type: z.enum(["bar", "line", "bar_horizontal"]),
  factRefs: z.array(z.string()).catch([]),
});

export const slideSpecSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SLIDE_TYPES),
  headline: z.string().catch(""),
  takeaway: z.string().catch(""),
  bullets: z.array(z.string()).catch([]),
  factRefs: z.array(z.string()).catch([]),
  chart: chartSpecSchema.optional(),
  speakerNotes: z.string().catch(""),
  estimatedSeconds: z.coerce.number().catch(50),
});

export const deckSpecSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().catch(""),
  slides: z.array(slideSpecSchema).min(1),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type SlideSpec = z.infer<typeof slideSpecSchema>;
export type DeckSpec = z.infer<typeof deckSpecSchema>;
