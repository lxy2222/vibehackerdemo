import type { Brief } from "@/lib/schemas/brief";

export const DEMO_LEADER_REQUEST = `周五给管理层五分钟，别做成流水账。重点看几个关键事项现在推进到哪、有没有要拍的板。技术细节少讲，除非已经卡住进度。`;

export function getDemoBrief(): Brief {
  return {
    focuses: ["progress", "decision"],
    funnel: [],
    progress: [
      {
        id: "progress-1",
        name: "信息流投放优化",
        status: "on_track",
        owner: "周敏",
        note: "转化在涨，客诉也在涨",
      },
      {
        id: "progress-2",
        name: "私域周末值班",
        status: "blocked",
        owner: "陈飞",
        note: "方案未定，周末转化会断档",
      },
      {
        id: "progress-3",
        name: "预算挪移建议",
        status: "at_risk",
        owner: "李然",
        note: "等管理层拍板是否从品牌挪到信息流",
      },
      {
        id: "progress-4",
        name: "质量指标口径",
        status: "on_track",
        owner: "王倩",
        note: "退订和客诉要不要上台还有分歧",
      },
    ],
  };
}
