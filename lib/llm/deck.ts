import { completeJsonWithRetry, proModel } from "@/lib/llm/client";
import {
  CONSULTING_DECK_EXAMPLE,
  CONSULTING_DECK_SYSTEM_PROMPT,
} from "@/lib/llm/consulting-prompt";
import { consultingDeckToSpec, parseConsultingDeck } from "@/lib/presentation/from-consulting";
import { durationForIntent } from "@/lib/presentation/limits";
import type { ReportAnalysis } from "@/lib/schemas/analysis";
import { INTENT_FOCUS, INTENT_LABELS } from "@/lib/schemas/analysis";
import type { DeckSpec } from "@/lib/schemas/deck";

function userPayload(input: {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
  currentDeck?: DeckSpec | null;
  feedback?: string;
  pageCount?: number | null;
}) {
  return {
    reportBackground: input.reportBackground,
    materials: input.materials,
    durationMinutes: input.durationMinutes,
    analysis: input.analysis,
    intent: input.analysis.intent,
    intentLabel: INTENT_LABELS[input.analysis.intent],
    intentFocus: INTENT_FOCUS[input.analysis.intent],
    currentDeck: input.currentDeck
      ? {
          title: input.currentDeck.title,
          audience: input.currentDeck.audience,
          reportGoal: input.currentDeck.reportGoal,
          slides: input.currentDeck.slides
            .filter((slide) => slide.type !== "cover")
            .map((slide) => ({
              slideType: "content",
              layoutId: slide.layoutId ?? slide.type,
              eyebrow: slide.eyebrow,
              headline: slide.headline,
              blocks: slide.blocks,
              managementImplication: slide.managementImplication || slide.takeaway,
              speakerNotes: slide.speakerNotes,
            })),
        }
      : null,
    feedback: input.feedback ?? null,
    requestedPageCount: input.pageCount ?? null,
  };
}

async function completeConsultingDeck(input: {
  extraRule: string;
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
  currentDeck?: DeckSpec | null;
  feedback?: string;
  pageCount?: number | null;
}): Promise<DeckSpec> {
  const durationMinutes = durationForIntent(input.analysis.intent, input.durationMinutes);
  const parsed = await completeJsonWithRetry(
    {
      model: proModel(),
      messages: [
        {
          role: "system",
          content: `${CONSULTING_DECK_SYSTEM_PROMPT}

补充约束：
- 汇报目的是「${INTENT_LABELS[input.analysis.intent]}」。${INTENT_FOCUS[input.analysis.intent]}
- 用户已确认的主线必须尊重，不要推翻材料仍支持的结论。
- 时长约 ${durationMinutes} 分钟，内容页不要多到讲不完。
${input.extraRule}
示例结构：${JSON.stringify(CONSULTING_DECK_EXAMPLE)}`,
        },
        {
          role: "user",
          content: JSON.stringify(userPayload({ ...input, durationMinutes })),
        },
      ],
    },
    (value) => parseConsultingDeck(value),
  );

  return consultingDeckToSpec({
    consulting: parsed,
    analysis: input.analysis,
    durationMinutes,
  });
}

export async function generateConsultingDeck(input: {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
}): Promise<DeckSpec> {
  return completeConsultingDeck({
    ...input,
    extraRule: "- 这是首次根据主线生成 PPT，按材料组织页面，不要照抄主线字段当标题。",
  });
}

export async function reviseConsultingDeck(input: {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
  current: DeckSpec;
  feedback: string;
  pageCount?: number | null;
}): Promise<DeckSpec> {
  const pageRule = input.pageCount
    ? `- 用户要求内容页和封面合计正好 ${input.pageCount} 页。页少就合并，页多就拆已有证据，不要编造新数字。`
    : "- 页数仍随材料决定，不要为了改意见而故意加页。";
  return completeConsultingDeck({
    reportBackground: input.reportBackground,
    materials: input.materials,
    durationMinutes: input.durationMinutes,
    analysis: input.analysis,
    currentDeck: input.current,
    feedback: input.feedback,
    pageCount: input.pageCount,
    extraRule: `- 根据用户意见修改现有 PPT，保留材料仍支持的结论和数字。
${pageRule}
- 不要发明材料里没有的事项、国家或数字。`,
  });
}
