import { INTENT_LABELS, INTENT_SLIDE_LABELS, type ReportAnalysis } from "@/lib/schemas/analysis";
import {
  COVER_SECONDS,
  DEFAULT_PAGE_COUNT,
  MAX_BODY_BULLETS,
  MAX_HEADLINE_CHARS,
  SLIDE_SECONDS,
  clampPageCount,
  durationForIntent,
} from "@/lib/presentation/limits";
import type { DeckSpec, SlideSpec } from "@/lib/presentation/types";

function clipHeadline(text: string, max = 24) {
  const chars = [...text.trim()];
  return chars.length <= max ? text.trim() : chars.slice(0, max).join("");
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
        eyebrow: "MANAGEMENT BRIEFING",
        headline: title,
        takeaway: analysis.leaderQuestion,
        bullets: [`${INTENT_LABELS[analysis.intent]} · ${durationMinutes} 分钟`],
        blocks: [],
        managementImplication: "",
        factRefs: [],
        speakerNotes: "",
        estimatedSeconds: COVER_SECONDS,
      },
      0,
    ),
    slide(
      {
        type: "progress_evidence",
        layoutId: "progress_evidence",
        eyebrow: "PROJECT UPDATE",
        headline: clipHeadline(analysis.coreConclusion || labels.summary, MAX_HEADLINE_CHARS),
        takeaway: analysis.decisionAsk ? `待拍板：${analysis.decisionAsk}` : analysis.leaderQuestion,
        bullets: bodyBullets,
        blocks: [
          ...analysis.keyFindings.slice(0, 2).map((item) => ({
            kind: "text" as const,
            label: "发现",
            value: item,
            detail: "",
            sourceRef: "已确认主线",
            status: "confirmed" as const,
          })),
          ...analysis.risks.slice(0, 1).map((item) => ({
            kind: "risk" as const,
            label: "风险",
            value: item,
            detail: "",
            sourceRef: "已确认主线",
            status: "confirmed" as const,
          })),
          ...analysis.nextActions.slice(0, 1).map((item) => ({
            kind: "action" as const,
            label: "下一步",
            value: item,
            detail: analysis.decisionAsk ?? "",
            sourceRef: "已确认主线",
            status: "confirmed" as const,
          })),
        ].slice(0, 4),
        managementImplication: analysis.decisionAsk
          ? `需要管理层决定：${analysis.decisionAsk}`
          : analysis.leaderQuestion,
        factRefs: [],
        speakerNotes: "按主线讲结论、证据、风险和下一步，不补充材料里没有的数字。",
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
    slides: deck.slides.map((slide) => {
      if (slide.type !== "cover") {
        return slide;
      }
      const extras = slide.bullets.filter((item) => item.trim() && item !== label);
      return { ...slide, bullets: extras.length > 0 ? [...extras, label] : [label] };
    }),
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

  if (n === 1) {
    return {
      ...deck,
      slides: [
        {
          ...cover,
          type: "cover",
          takeaway: cover.takeaway || rest[0]?.takeaway || "",
          estimatedSeconds: COVER_SECONDS,
        },
      ],
    };
  }

  const kept =
    rest.length <= n - 1
      ? rest
      : n === 2
        ? [rest[0]]
        : [...rest.slice(0, n - 2), rest[rest.length - 1]];

  return {
    ...deck,
    slides: [cover, ...kept].slice(0, n).map((item, index) => ({ ...item, id: `s${index + 1}` })),
  };
}
