import type { ReportIntent } from "@/lib/schemas/analysis";

export const DEFAULT_DURATION_MINUTES = 5;
export const MIN_PAGE_COUNT = 1;
export const DEFAULT_PAGE_COUNT = 4;
export const MAX_PAGE_COUNT = 8;
export const MAX_BODY_BULLETS = 16;
export const MAX_HEADLINE_CHARS = 56;
export const COVER_SECONDS = 15;
export const SLIDE_SECONDS = 60;

export function durationForIntent(intent: ReportIntent, requested: number) {
  if (intent === "result") {
    return DEFAULT_DURATION_MINUTES;
  }
  return requested > 0 ? requested : DEFAULT_DURATION_MINUTES;
}

export function clampPageCount(value: number) {
  if (!Number.isFinite(value)) {
    return MAX_PAGE_COUNT;
  }
  return Math.min(MAX_PAGE_COUNT, Math.max(MIN_PAGE_COUNT, Math.round(value)));
}
