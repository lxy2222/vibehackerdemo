import { reviseConsultingDeck } from "@/lib/llm/deck";
import { fitDeckToPageCount } from "@/lib/presentation/from-analysis";
import { applyCoverTitle, ensureCover, parseCoverTitle, parseRequestedPageCount } from "@/lib/presentation/ppt-feedback";
import type { ReportAnalysis } from "@/lib/schemas/analysis";
import type { DeckSpec } from "@/lib/schemas/deck";

export async function reviseDeckFromFeedback(input: {
  feedback: string;
  analysis: ReportAnalysis;
  current: DeckSpec;
  durationMinutes: number;
  reportBackground: string;
  materials: string;
}): Promise<DeckSpec> {
  const pageCount = parseRequestedPageCount(input.feedback);
  const coverTitle = parseCoverTitle(input.feedback);
  const deck = await reviseConsultingDeck({
    reportBackground: input.reportBackground,
    materials: input.materials,
    durationMinutes: input.durationMinutes,
    analysis: input.analysis,
    current: input.current,
    feedback: input.feedback,
    pageCount,
  });
  let next = ensureCover(deck);
  if (pageCount) {
    next = fitDeckToPageCount(next, pageCount);
  }
  if (coverTitle) {
    next = applyCoverTitle(next, coverTitle);
  }
  return next;
}
