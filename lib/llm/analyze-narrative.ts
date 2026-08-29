import {
  INTENT_FOCUS,
  INTENT_LABELS,
  reportAnalysisSchema,
  type ReportAnalysis,
  type ReportIntent,
} from "@/lib/schemas/analysis";
import { completeJsonWithRetry, flashModel } from "@/lib/llm/client";

const EXAMPLE: ReportAnalysis = {
  title: "跨国家复用交付进展",
  leaderQuestion: "复用是否已经证明交付更快，要不要先补新加坡的设计人手",
  intent: "result",
  coreConclusion: "复用已经把交付从数月压到数周，下一阶段卡在人手而不是方案",
  keyFindings: [
    "菲律宾首次交付大约三个月，印尼复用大约两周",
    "稳定性有口头结论，但材料里没有可上台的故障数字",
    "设计规范已经在印尼复用，新加坡还没排上设计人手",
  ],
  risks: [
    "新加坡排期被设计人手堵住，可能拖住下一国家",
    "稳定性口径对不上，会上可能被追问具体数字",
  ],
  nextActions: ["把新加坡人手不足和影响讲清楚", "给出是否这周拍板加人的选项"],
  decisionAsk: "是否先补新加坡设计人手",
  missingInformation: ["稳定性、故障率或客诉的可比较数字"],
  excludedDetails: ["具体技术实现细节"],
};

function clipList(items: string[], max = 8) {
  return items.slice(0, max);
}

function clipLine(text: string, max = 72) {
  const chars = [...text.trim()];
  return chars.length <= max ? chars.join("") : chars.slice(0, max).join("");
}

function clipTitle(text: string) {
  const chars = [...text.replace(/[《》【】「」""']/g, "").trim()];
  return chars.length <= 24 ? chars.join("") : chars.slice(0, 24).join("");
}

export function normalizeAnalysis(value: ReportAnalysis): ReportAnalysis {
  return {
    ...value,
    title: clipTitle(value.title),
    leaderQuestion: clipLine(value.leaderQuestion, 56),
    coreConclusion: clipLine(value.coreConclusion, 64),
    keyFindings: clipList(value.keyFindings).map((item) => clipLine(item)),
    risks: clipList(value.risks).map((item) => clipLine(item)),
    nextActions: clipList(value.nextActions).map((item) => clipLine(item)),
    missingInformation: clipList(value.missingInformation).map((item) => clipLine(item)),
    excludedDetails: clipList(value.excludedDetails, 6),
    decisionAsk: value.decisionAsk ? clipLine(value.decisionAsk, 48) : undefined,
  };
}

export async function analyzeNarrative(input: {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  current?: ReportAnalysis;
  lockedIntent?: ReportIntent;
}): Promise<ReportAnalysis> {
  const locked = input.lockedIntent;
  const intentRule = locked
    ? `- intent 必须是 ${locked}（${INTENT_LABELS[locked]}）。${INTENT_FOCUS[locked]} 用户换了汇报目的，必须按新目的重写 leaderQuestion、coreConclusion、keyFindings、risks、nextActions、decisionAsk，不要沿用上一版给其他目的写的句子。`
    : "- intent 只能是 result、progress、retrospective、decision、product_conversion。按材料判断最合适的目的。";
  const instruction = locked
    ? `用户刚把汇报目的改成「${INTENT_LABELS[locked]}」。按这个目的重新组织整份主线，不要只改 intent 字段。`
    : input.current
      ? "用户改过主线或补过材料。在现有主线基础上重分析，保留用户明确改过且材料仍支持的句子，不要编造。"
      : "从汇报背景和对话中总结封面标题，并识别领导要判断的问题。";

  const parsed = await completeJsonWithRetry(
    {
      model: flashModel(),
      messages: [
        {
          role: "system",
          content: `你是汇报主线分析器。根据用户的汇报背景和工作对话，提取领导这次要判断的问题、风险点和下一步。只返回 json。
规则：
- title 必须从汇报背景和材料里总结这次汇报的主题，8–16 个汉字，像「跨国家复用交付进展」。用名词短语，不要用结论整句，不要加「汇报」「PPT」后缀，不要从结论截断。
- 不要编造材料里没有的数字、人名、国家或结论。
- 材料不足、口径对不上、可能被追问的事项，一律写成风险点，写入 risks。不要使用「缺口」这个词。
${intentRule}
- keyFindings、risks、nextActions、missingInformation 尽量从材料抽出能上台的要点，各最多 8 条。每条写完整短句，不超过 60 个汉字，不要为了短而砍掉关键信息。面向 5 分钟、固定两页 PPT：封面只放标题和核心问题，第二页要把发现、风险、下一步和拍板尽量塞满。missingInformation 只作内部字段，内容也按风险点来写。
- decisionAsk 没有拍板事项时返回空字符串。
- excludedDetails 写下不该上台的细节，没有则空数组。
示例结构：${JSON.stringify(EXAMPLE)}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            reportBackground: input.reportBackground,
            materials: input.materials,
            durationMinutes: input.durationMinutes,
            currentAnalysis: input.current ?? null,
            lockedIntent: locked ?? null,
            instruction,
          }),
        },
      ],
    },
    (value) => {
      const next = normalizeAnalysis(reportAnalysisSchema.parse(value));
      return locked ? { ...next, intent: locked } : next;
    },
  );

  return parsed;
}
