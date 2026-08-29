export type Fact = {
  id: string;
  sourceId: string;
  label: string;
  value: number | string;
  unit: string | null;
  period: string | null;
  dimensions: Record<string, string>;
  locator: { sheet?: string; range?: string; paragraph?: number };
  calculation?: string;
};

export type ChartSpec = {
  type: "bar" | "line" | "bar_horizontal";
  factRefs: string[];
};

export type SlideType =
  | "cover"
  | "executive_summary"
  | "funnel"
  | "progress"
  | "tech_focus"
  | "diagnosis"
  | "recommendations"
  | "action_plan"
  | "kpi_overview"
  | "trend"
  | "comparison";

export type SlideSpec = {
  id: string;
  type: SlideType;
  headline: string;
  takeaway: string;
  bullets: string[];
  factRefs: string[];
  chart?: ChartSpec;
  speakerNotes: string;
  estimatedSeconds: number;
};

export type DeckSpec = {
  title: string;
  subtitle: string;
  slides: SlideSpec[];
};
