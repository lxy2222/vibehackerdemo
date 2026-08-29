import type { SlideBlock } from "@/lib/schemas/deck";

export function parseBlockNumber(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function statusLabel(status: SlideBlock["status"]) {
  if (status === "missing") {
    return "待补充";
  }
  if (status === "estimated") {
    return "口径待确认";
  }
  return "";
}
