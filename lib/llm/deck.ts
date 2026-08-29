import type { Fact } from "@/lib/presentation/types";
import {
  deckSpecSchema,
  TEMPLATE_SLIDE_TYPES,
  type DeckSpec,
} from "@/lib/schemas/deck";
import type { Brief } from "@/lib/schemas/brief";
import { FOCUS_LABELS } from "@/lib/schemas/brief";
import { completeJsonWithRetry, proModel } from "@/lib/llm/client";
import { normalizeDeckSpec, type NormalizeContext } from "@/lib/validation/deck";

const EXAMPLE = {
  title: "Q2 业务进展",
  subtitle: "管理层周会 · 关注进度 · 10 分钟",
  slides: [
    {
      id: "s1",
      type: "cover",
      headline: "Q2 业务进展",
      takeaway: "能交卷，关键事项还没打赢",
      bullets: ["关注：关注进度、关注拍板", "时长：10 分钟"],
      factRefs: [],
      speakerNotes: "",
      estimatedSeconds: 20,
    },
    {
      id: "s2",
      type: "executive_summary",
      headline: "核心结论",
      takeaway: "阻塞 {{fact_progress_blocked}} 项，需要当场拍板",
      bullets: ["值班方案未定，会影响周末转化", "预算挪移还等管理层拍板"],
      factRefs: ["fact_progress_blocked"],
      speakerNotes: "先给结论，再展开进度和待拍板事项。",
      estimatedSeconds: 70,
    },
  ],
};

function factCatalog(facts: Fact[]) {
  return facts.map((fact) => ({
    id: fact.id,
    label: fact.label,
    value: fact.value,
    unit: fact.unit,
    dimensions: fact.dimensions,
    calculation: fact.calculation ?? null,
  }));
}

function contextFrom(input: {
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief;
}): NormalizeContext {
  return {
    leaderRequest: input.leaderRequest,
    durationMinutes: input.durationMinutes,
    brief: input.brief,
  };
}

function systemPrompt(extra: string) {
  return `你是汇报模版编辑。只返回 DeckSpec json。
硬性规则：
- type 只能是：${TEMPLATE_SLIDE_TYPES.join("、")}。不要使用 kpi_overview、trend、comparison。
- 不含 x/y/fontSize。图表只写 type 和 factRefs，不写数据点。
- 标题不超过 24 个汉字，每页最多 5 条 bullet。
- 所有数字必须写成 {{fact_id}} 占位符，禁止裸数字（如 35%、1200）。封面时长可以用「10 分钟」这种用户给定时长。
- 只能引用提供的 fact id，不要编造表单里没有的事项和数字。
- funnel 页仅在用户提供了漏斗阶段数字时使用，factRefs 用 fact_funnel_1 这类阶段事实；没有漏斗数据就不要生成 funnel 页。
- progress 页 bullets 格式：事项｜状态｜负责人｜说明。
- 行动计划 bullets 格式：行动｜负责人｜截止。
- speakerNotes 是 40–80 秒中文讲稿。
${extra}
示例结构：${JSON.stringify(EXAMPLE)}`;
}

export async function generateDeckSpec(input: {
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief;
  facts: Fact[];
}): Promise<DeckSpec> {
  const ctx = contextFrom(input);
  const focusText = input.brief.focuses.map((focus) => FOCUS_LABELS[focus]).join("、");

  return completeJsonWithRetry(
    {
      model: proModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt(`- 页数 4–8。通常顺序：封面 → 核心结论 → 关注点对应的进度/技术页 → 问题 → 建议或行动。
- 关注点是：${focusText}。含「关注进度」必须有 progress 页；含「关注技术实现」必须有 tech_focus 页；含「关注拍板」行动计划靠前、写清待决策。不要默认生成业务漏斗页。`),
        },
        {
          role: "user",
          content: JSON.stringify({
            leaderRequest: input.leaderRequest,
            durationMinutes: input.durationMinutes,
            focuses: input.brief.focuses,
            funnel: input.brief.funnel,
            progress: input.brief.progress,
            facts: factCatalog(input.facts),
          }),
        },
      ],
    },
    (value) => normalizeDeckSpec(deckSpecSchema.parse(value), input.facts, ctx),
  );
}

export async function reviseDeckSpec(input: {
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief;
  facts: Fact[];
  current: DeckSpec;
  feedback: string;
}): Promise<DeckSpec> {
  const ctx = contextFrom(input);

  return completeJsonWithRetry(
    {
      model: proModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt(`- 根据用户意见修改现有 DeckSpec，页数仍 4–8。
- 不要改 Fact 里的数字，不要发明新事项。
- 「进度写轻了」应加重 progress 页；没有漏斗数据时不要补漏斗页。`),
        },
        {
          role: "user",
          content: JSON.stringify({
            leaderRequest: input.leaderRequest,
            feedback: input.feedback,
            currentDeck: input.current,
            focuses: input.brief.focuses,
            facts: factCatalog(input.facts),
          }),
        },
      ],
    },
    (value) => normalizeDeckSpec(deckSpecSchema.parse(value), input.facts, ctx),
  );
}

export async function resizeDeckSpec(input: {
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief;
  facts: Fact[];
  current: DeckSpec;
  pageCount: number;
}): Promise<DeckSpec> {
  const ctx: NormalizeContext = {
    ...contextFrom(input),
    exactSlides: input.pageCount,
  };

  return completeJsonWithRetry(
    {
      model: proModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt(`- 把现有 DeckSpec 改成正好 ${input.pageCount} 页。必须保留封面。
- 页少就合并，页多就拆分已有内容，不要编造新数字和新事项。`),
        },
        {
          role: "user",
          content: JSON.stringify({
            pageCount: input.pageCount,
            currentDeck: input.current,
            focuses: input.brief.focuses,
            facts: factCatalog(input.facts),
          }),
        },
      ],
    },
    (value) =>
      normalizeDeckSpec(deckSpecSchema.parse(value), input.facts, ctx),
  );
}
