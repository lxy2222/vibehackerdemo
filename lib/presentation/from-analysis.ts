import { INTENT_LABELS, INTENT_SLIDE_LABELS, type ReportAnalysis } from "@/lib/schemas/analysis";
import {
  COVER_SECONDS,
  DEFAULT_PAGE_COUNT,
  MAX_BODY_BULLETS,
  SLIDE_SECONDS,
  clampPageCount,
  durationForIntent,
} from "@/lib/presentation/limits";
import type { DeckSpec, SlideSpec } from "@/lib/presentation/types";

function clipHeadline(text: string) {
  const chars = [...text.trim()];
  return chars.length <= 24 ? text.trim() : chars.slice(0, 24).join("");
}

function clean(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function pack(items: string[], prefix: string) {
  return clean(items).map((item) => (item.startsWith(`${prefix}：`) ? item : `${prefix}：${item}`));
}

export function titleFromMaterials(analysis: ReportAnalysis, reportBackground: string) {
  if (analysis.title.trim()) {
    return clipHeadline(analysis.title);
  }
  const firstLine = reportBackground.split("\n")[0]?.trim() ?? "";
  return clipHeadline(firstLine || "工作汇报");
}

function slide(partial: Omit<SlideSpec, "id" | "estimatedSeconds"> & { estimatedSeconds?: number }, index: number): SlideSpec {
  return {
    ...partial,
    id: `s${index + 1}`,
    estimatedSeconds: partial.estimatedSeconds ?? SLIDE_SECONDS,
  };
}

export function packBodyBullets(analysis: ReportAnalysis) {
  return [
    ...pack(analysis.keyFindings, "发现"),
    ...pack([...analysis.risks, ...analysis.missingInformation], "风险"),
    ...pack(analysis.nextActions, "下一步"),
    ...(analysis.decisionAsk ? [`待拍板：${analysis.decisionAsk.trim()}`] : []),
  ].slice(0, MAX_BODY_BULLETS);
}

export function deckFromAnalysis(input: {
  reportBackground: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
}): DeckSpec {
  const { analysis, reportBackground } = input;
  const durationMinutes = durationForIntent(analysis.intent, input.durationMinutes);
  const labels = INTENT_SLIDE_LABELS[analysis.intent];
  const title = titleFromMaterials(analysis, reportBackground);
  const bodyBullets = packBodyBullets(analysis);

  const slides: SlideSpec[] = [
    slide(
      {
        type: "cover",
        headline: title,
        takeaway: analysis.leaderQuestion,
        bullets: [`${INTENT_LABELS[analysis.intent]} · ${durationMinutes} 分钟`],
        factRefs: [],
        speakerNotes: "",
        estimatedSeconds: COVER_SECONDS,
      },
      0,
    ),
    slide(
      {
        type: "executive_summary",
        headline: labels.summary,
        takeaway: analysis.coreConclusion,
        bullets: bodyBullets,
        factRefs: [],
        speakerNotes: "第二页尽量讲全：结论、发现、风险、下一步和拍板。数字只用来自材料的表述。",
      },
      1,
    ),
  ];

  return {
    title,
    subtitle: `${INTENT_LABELS[analysis.intent]} · ${durationMinutes} 分钟`,
    slides: slides.slice(0, DEFAULT_PAGE_COUNT),
  };
}

export function stampDeckDuration(deck: DeckSpec, intentLabel: string, durationMinutes: number): DeckSpec {
  const label = `${intentLabel} · ${durationMinutes} 分钟`;
  return {
    ...deck,
    subtitle: label,
    slides: deck.slides.map((slide) =>
      slide.type === "cover" ? { ...slide, bullets: [label] } : slide,
    ),
  };
}

export function fitDeckToPageCount(deck: DeckSpec, pageCount: number): DeckSpec {
  const n = clampPageCount(pageCount);
  const slides = deck.slides;
  if (slides.length <= n) {
    return {
      ...deck,
      slides: slides.map((item, index) => ({ ...item, id: `s${index + 1}` })),
    };
  }

  const cover = slides[0];
  const rest = slides.slice(1);
  const mergedBullets = rest.flatMap((item) => item.bullets).slice(0, MAX_BODY_BULLETS);

  if (n === 1) {
    return {
      ...deck,
      slides: [
        {
          ...cover,
          type: "cover",
          takeaway: cover.takeaway || rest[0]?.takeaway || "",
          bullets: mergedBullets,
          estimatedSeconds: COVER_SECONDS,
        },
      ],
    };
  }

  return {
    ...deck,
    slides: [
      cover,
      {
        ...(rest[0] ?? cover),
        id: "s2",
        type: rest[0]?.type ?? "executive_summary",
        takeaway: rest[0]?.takeaway || cover.takeaway,
        bullets: mergedBullets,
        estimatedSeconds: SLIDE_SECONDS,
      },
      ...rest.slice(1, n - 1),
    ].slice(0, n).map((item, index) => ({ ...item, id: `s${index + 1}` })),
  };
}
