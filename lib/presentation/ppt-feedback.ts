import type { DeckSpec, SlideSpec } from "@/lib/presentation/types";
import { MAX_PAGE_COUNT, clampPageCount } from "@/lib/presentation/limits";

export const PPT_NOTE_PREFIX = "【PPT】";

const PPT_PATTERN =
  /ppt|pptx|幻灯片|页数|封面|标题居中|居中|排版|版式|合并|少一页|只要\s*[1-8一二两三四五六七八]\s*页|[1-8一二两三四五六七八]页/i;

const CONTENT_PATTERN = /结论|风险|发现|主线|行动|拍板|问题|目的|材料|背景|改写|锋利|写轻|补一句/;

const PAGE_COUNT_PATTERN = /(?:只要|改成|改为|换成|做成|压缩到|控制在)?\s*([1-8一二两三四五六七八])\s*页/;

const COVER_TITLE_PATTERN = /封面标题(?:改成|改为|换成|用)\s*[「「""']?([^」」""'\n]{2,24})/;

const CN_PAGES: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
};

export function isPptNote(text: string) {
  return text.startsWith(PPT_NOTE_PREFIX);
}

export function toPptNote(feedback: string) {
  return `${PPT_NOTE_PREFIX}${feedback.trim()}`;
}

export function pptNotesFrom(items: string[]) {
  return items.filter(isPptNote);
}

export function withoutPptNotes(items: string[]) {
  return items.filter((item) => !isPptNote(item));
}

export function isPptFeedback(text: string) {
  return PPT_PATTERN.test(text.trim());
}

export function isContentFeedback(text: string) {
  return CONTENT_PATTERN.test(text.trim());
}

export function parseRequestedPageCount(text: string) {
  const match = text.match(PAGE_COUNT_PATTERN);
  if (!match?.[1]) {
    return null;
  }
  const n = CN_PAGES[match[1]];
  return n ? clampPageCount(n) : null;
}

export function parseCoverTitle(text: string) {
  const match = text.match(COVER_TITLE_PATTERN);
  const title = match?.[1]?.trim();
  return title || null;
}

export function needsDeckLlm(text: string) {
  if (!isPptFeedback(text)) {
    return false;
  }
  const leftover = text
    .replace(PAGE_COUNT_PATTERN, " ")
    .replace(COVER_TITLE_PATTERN, " ")
    .replace(/封面标题|标题居中|居中|ppt|pptx|幻灯片|页数|排版|版式/gi, " ")
    .replace(/[\s，。、！？;；:：]/g, "");
  return leftover.length > 0;
}

export function applyCoverTitle(deck: DeckSpec, title: string): DeckSpec {
  const headline = title.trim();
  if (!headline) {
    return deck;
  }
  return {
    ...deck,
    title: headline,
    slides: deck.slides.map((slide, index) =>
      index === 0 || slide.type === "cover" ? { ...slide, headline } : slide,
    ),
  };
}

export function ensureCover(deck: DeckSpec): DeckSpec {
  const cover = deck.slides.find((slide) => slide.type === "cover");
  const rest = deck.slides.filter((slide) => slide.type !== "cover");
  const nextCover: SlideSpec = cover ?? {
    ...deck.slides[0],
    type: "cover",
    headline: deck.title,
  };
  const slides = [nextCover, ...rest].slice(0, MAX_PAGE_COUNT).map((slide, index) => ({
    ...slide,
    id: `s${index + 1}`,
  }));
  return { ...deck, slides };
}
