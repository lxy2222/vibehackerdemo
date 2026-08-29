import { z } from "zod";

export const LEADER_FOCUSES = ["progress", "tech", "decision"] as const;
export type LeaderFocus = (typeof LEADER_FOCUSES)[number];

export const FOCUS_LABELS: Record<LeaderFocus, string> = {
  progress: "关注进度",
  tech: "关注技术实现",
  decision: "关注拍板",
};

export const PROGRESS_STATUSES = ["on_track", "at_risk", "blocked", "done"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  on_track: "进行中",
  at_risk: "有风险",
  blocked: "已阻塞",
  done: "已完成",
};

export const funnelStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  value: z.coerce.number().finite().min(0),
});

export const progressItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  status: z.enum(PROGRESS_STATUSES),
  owner: z.string().trim().catch(""),
  note: z.string().trim().catch(""),
});

export const briefSchema = z.object({
  focuses: z
    .array(z.enum(LEADER_FOCUSES))
    .min(1)
    .transform((items) => [...new Set(items)]),
  funnel: z.array(funnelStageSchema).max(8).default([]),
  progress: z.array(progressItemSchema).min(1).max(12),
});

export type FunnelStage = z.infer<typeof funnelStageSchema>;
export type ProgressItem = z.infer<typeof progressItemSchema>;
export type Brief = z.infer<typeof briefSchema>;

export function hasFunnelStages(brief: { funnel: FunnelStage[] }) {
  return brief.funnel.length >= 2;
}

export function defaultFunnelStages(): FunnelStage[] {
  return [
    { id: "funnel-1", name: "线索", value: 0 },
    { id: "funnel-2", name: "商机", value: 0 },
    { id: "funnel-3", name: "方案", value: 0 },
    { id: "funnel-4", name: "成交", value: 0 },
  ];
}

export function defaultProgressItems(): ProgressItem[] {
  return [
    { id: "progress-1", name: "", status: "on_track", owner: "", note: "" },
    { id: "progress-2", name: "", status: "on_track", owner: "", note: "" },
  ];
}
