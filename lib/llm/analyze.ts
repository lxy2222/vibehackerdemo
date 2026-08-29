import type { NoteChunk } from "@/lib/parsers/notes";
import type { Fact } from "@/lib/presentation/types";
import {
  requirementSpecSchema,
  type RequirementSpec,
} from "@/lib/schemas/requirement";
import { completeJsonWithRetry, flashModel } from "@/lib/llm/client";

const EXAMPLE = {
  goal: "给管理层做活动复盘",
  audience: null,
  deadline: "周五下午",
  durationMinutes: 10,
  reportType: "project_review",
  focusMetrics: ["效果", "问题", "预算"],
  expectedDecisions: [],
  requiredSections: ["效果", "问题", "下季度调整"],
  constraints: ["不要流水账", "要有明确建议"],
  missingFields: ["audience", "comparisonBaseline"],
  clarificationQuestions: [
    "听众是公司管理层还是客户？",
    "对比口径是环比还是同比？",
    "预算要不要给出挪移建议？",
  ],
};

export async function analyzeRequirements(input: {
  leaderRequest: string;
  durationMinutes: number;
  notes: NoteChunk[];
  facts: Fact[];
  columns: string[];
}): Promise<RequirementSpec> {
  const factDigest = input.facts.slice(0, 40).map((fact) => ({
    id: fact.id,
    label: fact.label,
    value: fact.value,
    unit: fact.unit,
    period: fact.period,
    dimensions: fact.dimensions,
  }));

  const parsed = await completeJsonWithRetry(
    {
      model: flashModel(),
      messages: [
        {
          role: "system",
          content: `你是汇报需求分析器。根据领导原话和材料，提取 RequirementSpec。只返回 json。
规则：
- 提取不到的字段必须是 null 或空数组，禁止猜测。
- reportType 固定为 "project_review"。
- durationMinutes 若原文未写，使用用户填写的默认值。
- clarificationQuestions 最多 3 条，只问会改变结论、结构或数据口径的缺口。不要问视觉偏好。
- 不要编造数字。
示例结构：${JSON.stringify(EXAMPLE)}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            leaderRequest: input.leaderRequest,
            durationMinutes: input.durationMinutes,
            notes: input.notes.slice(0, 30),
            columns: input.columns,
            facts: factDigest,
          }),
        },
      ],
    },
    (value) => requirementSpecSchema.parse(value),
  );

  const spec = requirementSpecSchema.parse(parsed);
  if (!spec.durationMinutes) {
    spec.durationMinutes = input.durationMinutes;
  }
  return spec;
}
