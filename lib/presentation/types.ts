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

export type {
  ChartSpec,
  DeckSpec,
  LayoutId,
  SlideBlock,
  SlideSpec,
  SlideType,
} from "@/lib/schemas/deck";
