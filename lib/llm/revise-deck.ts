import { completeJsonWithRetry, flashModel } from "@/lib/llm/client";
import { deckSpecSchema, type DeckSpec } from "@/lib/schemas/deck";
import type { ReportAnalysis } from "@/lib/schemas/analysis";
import { fitDeckToPageCount } from "@/lib/presentation/from-analysis";
import { DEFAULT_PAGE_COUNT, MAX_BODY_BULLETS, MAX_PAGE_COUNT } from "@/lib/presentation/limits";
import { applyCoverTitle, ensureCover, parseCoverTitle, parseRequestedPageCount } from "@/lib/presentation/ppt-feedback";

function compactDeck(deck: DeckSpec, pageCount?: number | null): DeckSpec {
  const withCover = ensureCover({
    ...deck,
    slides: deck.slides.map((slide) => ({
      ...slide,
      bullets: slide.type === "cover" ? slide.bullets.slice(0, 2) : slide.bullets.slice(0, MAX_BODY_BULLETS),
    })),
  });
  return fitDeckToPageCount(withCover, pageCount ?? DEFAULT_PAGE_COUNT);
}

export async function reviseDeckFromFeedback(input: {
  feedback: string;
  analysis: ReportAnalysis;
  current: DeckSpec;
  durationMinutes: number;
}): Promise<DeckSpec> {
  const pageCount = parseRequestedPageCount(input.feedback);
  const coverTitle = parseCoverTitle(input.feedback);
  const parsed = await completeJsonWithRetry(
    {
      model: flashModel(),
      messages: [
        {
          role: "system",
          content: `你是 PPT 编辑。根据用户意见改现有 DeckSpec，只返回 json。
规则：
- 必须有封面，type 为 cover。封面 headline 是标题。
- 默认正好两页：封面 + 一页内容。最多 ${MAX_PAGE_COUNT} 页。用户指定页数时必须遵守。
- 第二页尽量把 analysis 里的发现、风险、下一步、待拍板写进 bullets，可以密，不要每页只写三句。
- 不要编造材料里没有的数字、国家或结论。
- 不要为了凑页而拆页。`,
        },
        {
          role: "user",
          content: JSON.stringify({
            feedback: input.feedback,
            durationMinutes: input.durationMinutes,
            requestedPageCount: pageCount,
            analysis: input.analysis,
            currentDeck: input.current,
          }),
        },
      ],
    },
    (value) => deckSpecSchema.parse(value),
  );
  let deck = compactDeck(parsed, pageCount);
  if (coverTitle) {
    deck = applyCoverTitle(deck, coverTitle);
  }
  return deck;
}
