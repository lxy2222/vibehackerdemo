import { INTENT_LABELS, INTENT_SLIDE_LABELS, type ReportAnalysis } from "@/lib/schemas/analysis";
import type { DeckSpec, SlideSpec } from "@/lib/presentation/types";

function clipHeadline(text: string) {
  const chars = [...text.trim()];
  return chars.length <= 24 ? text.trim() : chars.slice(0, 24).join("");
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
    estimatedSeconds: partial.estimatedSeconds ?? 50,
  };
}

export function deckFromAnalysis(input: {
  reportBackground: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
}): DeckSpec {
  const { analysis, durationMinutes, reportBackground } = input;
  const labels = INTENT_SLIDE_LABELS[analysis.intent];
  const title = titleFromMaterials(analysis, reportBackground);
  const slides: SlideSpec[] = [
    slide(
      {
        type: "cover",
        headline: title,
        takeaway: analysis.leaderQuestion,
        bullets: [`${INTENT_LABELS[analysis.intent]} · ${durationMinutes} 分钟`],
        factRefs: [],
        speakerNotes: "",
        estimatedSeconds: 20,
      },
      0,
    ),
    slide(
      {
        type: "executive_summary",
        headline: labels.summary,
        takeaway: analysis.coreConclusion,
        bullets: analysis.keyFindings.slice(0, 5),
        factRefs: [],
        speakerNotes: "先讲结论和关键发现，数字只用来自材料的表述。",
      },
      1,
    ),
  ];

  const problemBullets = [...analysis.risks, ...analysis.missingInformation].slice(0, 5);
  if (problemBullets.length > 0) {
    slides.push(
      slide(
        {
          type: "diagnosis",
          headline: labels.diagnosis,
          takeaway: analysis.risks[0] || analysis.missingInformation[0] || "先把会上可能被追问的风险点讲清楚",
          bullets: problemBullets,
          factRefs: [],
          speakerNotes: "只讲风险点，没有的数字不要补。",
        },
        slides.length,
      ),
    );
  }

  const actionBullets = [
    ...analysis.nextActions,
    ...(analysis.decisionAsk ? [`待拍板：${analysis.decisionAsk}`] : []),
  ].slice(0, 5);
  if (actionBullets.length > 0) {
    slides.push(
      slide(
        {
          type: "recommendations",
          headline: labels.action,
          takeaway: analysis.decisionAsk || analysis.nextActions[0] || "下一步按已确认主线推进",
          bullets: actionBullets,
          factRefs: [],
          speakerNotes: "只讲下一步和需要领导拍的板。",
        },
        slides.length,
      ),
    );
  }

  return {
    title,
    subtitle: `${INTENT_LABELS[analysis.intent]} · ${durationMinutes} 分钟`,
    slides,
  };
}
