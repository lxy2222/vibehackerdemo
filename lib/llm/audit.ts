import { auditReportSchema, type AuditReport } from "@/lib/schemas/audit";
import { completeJsonWithRetry, proModel } from "@/lib/llm/client";
import type { CodeAuditInput } from "@/lib/validation/audit";
import { mergeAudits, runCodeAudit } from "@/lib/validation/audit";

export async function auditProject(input: CodeAuditInput): Promise<AuditReport> {
  const code = runCodeAudit(input);
  try {
    const semantic = await completeJsonWithRetry(
      {
        model: proModel(),
        messages: [
          {
            role: "system",
            content: `你是汇报验收官。根据一句话汇报、材料、主线和幻灯片，判断能不能交给领导。只返回 json。
规则：
- status 只能是 ready 或 needs_revision。有 blockers 就必须是 needs_revision。
- blockers：会让领导当场打回的问题。不要把「缺少量化」写成阻塞，除非领导在一句话汇报里点名了某个指标而材料没有。
- suggestions：可改进但不挡提交，例如缺量化、表述可以更锋利。
- likelyFollowups：会上可能被追问的 2–4 个短句。
- deliveryMessage：一句可直接发给老板的汇报总结，先结论、含关键结果或卡点。不要编造材料里没有的数字，不要写成段落。
- 不要重复代码已经写出的阻塞，只补语义问题。`,
          },
          {
            role: "user",
            content: JSON.stringify({
              reportBackground: input.reportBackground,
              materials: input.materials,
              durationMinutes: input.durationMinutes,
              analysis: input.analysis,
              deck: input.deck
                ? {
                    title: input.deck.title,
                    slides: input.deck.slides.map((slide) => ({
                      type: slide.type,
                      layoutId: slide.layoutId ?? slide.type,
                      headline: slide.headline,
                      takeaway: slide.takeaway || slide.managementImplication,
                      bullets: slide.bullets,
                      blocks: slide.blocks,
                    })),
                  }
                : null,
              codeAudit: {
                blockers: code.blockers,
                suggestions: code.suggestions,
              },
            }),
          },
        ],
      },
      (value) => auditReportSchema.parse(value),
    );
    return mergeAudits(code, semantic);
  } catch {
    return code;
  }
}
