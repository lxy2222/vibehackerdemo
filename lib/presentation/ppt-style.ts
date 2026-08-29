import { theme } from "@/lib/presentation/theme";
import type { SlideBlock } from "@/lib/schemas/deck";

export type BlockTone = "paper" | "lime" | "sage" | "ink";

export const NODE_COLORS = [theme.lime, theme.sage, theme.ink, theme.stone] as const;

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function blockTone(block: SlideBlock, index: number): BlockTone {
  if (block.status === "missing") {
    return "lime";
  }
  if (block.kind === "risk") {
    return "ink";
  }
  if (index === 0 && (block.kind === "metric" || block.kind === "text")) {
    return "lime";
  }
  if (index === 1) {
    return "sage";
  }
  return "paper";
}

export function barColor(index: number, total: number) {
  if (index === total - 1) {
    return theme.ink;
  }
  if (index === 0) {
    return theme.lime;
  }
  return index % 2 === 0 ? theme.sage : theme.stone;
}
