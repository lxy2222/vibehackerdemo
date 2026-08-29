import { z } from "zod";

export const requirementSpecSchema = z.object({
  goal: z.string().nullable().catch(null),
  audience: z.string().nullable().catch(null),
  deadline: z.string().nullable().catch(null),
  durationMinutes: z.coerce.number().int().min(1).max(90).catch(5),
  reportType: z.literal("project_review").catch("project_review"),
  focusMetrics: z.array(z.string()).catch([]),
  expectedDecisions: z.array(z.string()).catch([]),
  requiredSections: z.array(z.string()).catch([]),
  constraints: z.array(z.string()).catch([]),
  missingFields: z.array(z.string()).catch([]),
  clarificationQuestions: z
    .array(z.string())
    .catch([])
    .transform((items) => items.filter(Boolean).slice(0, 3)),
});

export type RequirementSpec = z.infer<typeof requirementSpecSchema>;

export const columnMappingSchema = z.object({
  period: z.string().nullable(),
  dimensions: z.array(z.string()),
  metrics: z.array(z.string()),
  headers: z.array(z.string()).catch([]),
  confidence: z.enum(["high", "low"]),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;
