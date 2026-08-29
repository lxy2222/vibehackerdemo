import fs from "node:fs/promises";
import { analyzeNarrative } from "@/lib/llm/analyze-narrative";
import { generatePptxBuffer } from "@/lib/presentation/generate-pptx";
import { deckFromAnalysis } from "@/lib/presentation/from-analysis";
import type { Fact } from "@/lib/presentation/types";
import { briefSchema, type Brief } from "@/lib/schemas/brief";
import {
  REPORT_INTENTS,
  reportAnalysisSchema,
  type ReportAnalysis,
} from "@/lib/schemas/analysis";
import { auditReportSchema, type AuditReport } from "@/lib/schemas/audit";
import type { DeckSpec } from "@/lib/schemas/deck";
import { auditProject } from "@/lib/llm/audit";
import { DEMO_MATERIALS, DEMO_REPORT_BACKGROUND } from "@/lib/demo/narrative";
import { saveArtifact } from "@/lib/storage/files";
import {
  createProjectRow,
  getDeckRow,
  getProjectRow,
  insertDeckRow,
  updateProjectRow,
} from "@/lib/projects/store";
import type { ProjectDTO, ProjectRecord, ProjectStatus } from "@/lib/projects/types";

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function asStatus(raw: string): ProjectStatus {
  if (raw === "ready" || raw === "generating" || raw === "draft" || raw === "failed") {
    return raw;
  }
  if (raw === "completed" || raw === "review_required") {
    return "ready";
  }
  return "draft";
}

function parseAnalysis(raw: string | null): ReportAnalysis | null {
  const parsed = reportAnalysisSchema.safeParse(parseJson(raw, null));
  return parsed.success ? parsed.data : null;
}

function parseAudit(raw: string | null): AuditReport | null {
  const parsed = auditReportSchema.safeParse(parseJson(raw, null));
  return parsed.success ? parsed.data : null;
}

export function toDTO(project: ProjectRecord): ProjectDTO {
  return {
    id: project.id,
    status: asStatus(project.status),
    leaderRequest: project.leaderRequest,
    durationMinutes: project.durationMinutes,
    materials: project.notesChunks ?? "",
    brief: parseJson<Brief | null>(project.brief, null),
    analysis: parseAnalysis(project.analysis),
    audit: parseAudit(project.audit),
    facts: parseJson<Fact[]>(project.facts, []),
    deck: parseJson<DeckSpec | null>(project.deckSpec, null),
    deckId: project.deckId,
    errorMessage: project.errorMessage,
  };
}

export function getProjectDTO(id: string): ProjectDTO | null {
  const project = getProjectRow(id);
  if (!project) {
    return null;
  }
  return toDTO(project);
}

function requireAnalysis(project: ProjectRecord): ReportAnalysis {
  const analysis = parseAnalysis(project.analysis);
  if (!analysis) {
    throw new Error("还没有分析主线，请先确认汇报背景");
  }
  return analysis;
}

async function runAnalysis(
  project: ProjectRecord,
  current?: ReportAnalysis,
  lockedIntent?: ReportAnalysis["intent"],
) {
  const analysis = await analyzeNarrative({
    reportBackground: project.leaderRequest,
    materials: project.notesChunks ?? "",
    durationMinutes: project.durationMinutes,
    current,
    lockedIntent,
  });
  const deck = deckFromAnalysis({
    reportBackground: project.leaderRequest,
    durationMinutes: project.durationMinutes,
    analysis,
  });
  updateProjectRow(project.id, {
    status: "ready",
    analysis: JSON.stringify(analysis),
    deckSpec: JSON.stringify(deck),
    facts: JSON.stringify([]),
    audit: null,
    errorMessage: null,
  });
  return getProjectDTO(project.id)!;
}

export async function createAndAnalyze(input: {
  reportBackground?: string;
  leaderRequest?: string;
  materials?: string;
  durationMinutes?: number;
  useDemo?: boolean;
}): Promise<ProjectDTO> {
  const durationMinutes = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 10;
  const reportBackground = input.useDemo
    ? DEMO_REPORT_BACKGROUND
    : (input.reportBackground ?? input.leaderRequest ?? "").trim();
  const materials = input.useDemo ? DEMO_MATERIALS : (input.materials ?? "").trim();
  if (!reportBackground) {
    throw new Error("请填写最初的汇报背景");
  }

  const project = createProjectRow({
    leaderRequest: reportBackground,
    durationMinutes,
    notesChunks: materials,
  });

  updateProjectRow(project.id, { status: "generating", errorMessage: null });

  try {
    return await runAnalysis(getProjectRow(project.id)!);
  } catch (error) {
    updateProjectRow(project.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "分析失败",
    });
    throw error;
  }
}

export async function reanalyzeProject(
  projectId: string,
  input: {
    reportBackground?: string;
    materials?: string;
    analysis?: unknown;
    lockedIntent?: ReportAnalysis["intent"];
  },
): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  const reportBackground = (input.reportBackground ?? project.leaderRequest).trim();
  const materials = (input.materials ?? project.notesChunks ?? "").trim();
  const current = input.analysis
    ? reportAnalysisSchema.parse(input.analysis)
    : parseAnalysis(project.analysis) ?? undefined;
  const lockedIntent = REPORT_INTENTS.includes(input.lockedIntent as ReportAnalysis["intent"])
    ? (input.lockedIntent as ReportAnalysis["intent"])
    : undefined;
  const seed = lockedIntent && current ? { ...current, intent: lockedIntent } : current;
  if (!reportBackground) {
    throw new Error("请填写最初的汇报背景");
  }

  updateProjectRow(projectId, {
    status: "generating",
    leaderRequest: reportBackground,
    notesChunks: materials,
    analysis: seed ? JSON.stringify(seed) : project.analysis,
    audit: null,
    errorMessage: null,
  });

  try {
    return await runAnalysis(getProjectRow(projectId)!, seed, lockedIntent);
  } catch (error) {
    updateProjectRow(projectId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "重新分析失败",
    });
    throw error;
  }
}

export async function saveAnalysis(
  projectId: string,
  input: { reportBackground?: string; materials?: string; analysis: unknown },
): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  const analysis = reportAnalysisSchema.parse(input.analysis);
  const reportBackground = (input.reportBackground ?? project.leaderRequest).trim();
  const materials = (input.materials ?? project.notesChunks ?? "").trim();
  if (!reportBackground) {
    throw new Error("请填写最初的汇报背景");
  }
  const deck = deckFromAnalysis({
    reportBackground,
    durationMinutes: project.durationMinutes,
    analysis,
  });

  updateProjectRow(projectId, {
    status: "ready",
    leaderRequest: reportBackground,
    notesChunks: materials,
    analysis: JSON.stringify(analysis),
    deckSpec: JSON.stringify(deck),
    facts: JSON.stringify([]),
    audit: null,
    errorMessage: null,
  });
  return getProjectDTO(projectId)!;
}

export async function reviseProject(projectId: string, feedback: string): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }
  const trimmed = feedback.trim();
  if (!trimmed) {
    throw new Error("请填写修改意见");
  }

  const current = requireAnalysis(project);
  updateProjectRow(projectId, { status: "generating", errorMessage: null });

  try {
    return await runAnalysis(getProjectRow(projectId)!, {
      ...current,
      excludedDetails: [...current.excludedDetails, `用户意见：${trimmed}`],
    });
  } catch (error) {
    updateProjectRow(projectId, {
      status: "ready",
      errorMessage: error instanceof Error ? error.message : "按意见重生成失败",
    });
    throw error;
  }
}

export async function exportProjectPptx(projectId: string, _pageCount: number): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  const analysis = parseAnalysis(project.analysis);
  let deck = parseJson<DeckSpec | null>(project.deckSpec, null);
  if (!deck && analysis) {
    deck = deckFromAnalysis({
      reportBackground: project.leaderRequest,
      durationMinutes: project.durationMinutes,
      analysis,
    });
  }
  if (!deck) {
    throw new Error("还没有模版");
  }

  updateProjectRow(projectId, { status: "generating", errorMessage: null });

  try {
    const facts = parseJson<Fact[]>(project.facts, []);
    const buffer = await generatePptxBuffer(deck, facts);
    if (!buffer.length) {
      throw new Error("已导出的 PPTX 是空文件");
    }
    const deckId = crypto.randomUUID();
    const pptxPath = await saveArtifact(deckId, buffer);
    insertDeckRow({
      id: deckId,
      projectId,
      spec: JSON.stringify(deck),
      facts: JSON.stringify(facts),
      pptxPath,
    });
    updateProjectRow(projectId, {
      status: "ready",
      deckId,
      deckSpec: JSON.stringify(deck),
      errorMessage: null,
    });
    return getProjectDTO(projectId)!;
  } catch (error) {
    updateProjectRow(projectId, {
      status: "ready",
      errorMessage: error instanceof Error ? error.message : "导出 PPT 失败",
    });
    throw error;
  }
}

export async function auditProjectById(projectId: string): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  let pptxBytes: number | null = null;
  if (project.deckId) {
    const row = getDeckRow(project.deckId);
    if (row) {
      try {
        const bytes = await fs.readFile(row.pptxPath);
        pptxBytes = bytes.length;
      } catch {
        pptxBytes = 0;
      }
    }
  }

  const report = await auditProject({
    reportBackground: project.leaderRequest,
    materials: project.notesChunks ?? "",
    durationMinutes: project.durationMinutes,
    analysis: parseAnalysis(project.analysis),
    deck: parseJson<DeckSpec | null>(project.deckSpec, null),
    facts: parseJson<Fact[]>(project.facts, []),
    pptxBytes,
  });

  updateProjectRow(projectId, {
    status: "ready",
    audit: JSON.stringify(report),
    errorMessage: null,
  });
  return getProjectDTO(projectId)!;
}

export async function readDeckPptx(deckId: string): Promise<{ filename: string; bytes: Buffer }> {
  const row = getDeckRow(deckId);
  if (!row) {
    throw new Error("文件不存在");
  }

  const spec = parseJson<DeckSpec>(row.spec, { title: "汇报", subtitle: "", slides: [] });
  try {
    const bytes = await fs.readFile(row.pptxPath);
    return { filename: `${spec.title || "汇报"}.pptx`, bytes };
  } catch {
    const facts = parseJson<Fact[]>(row.facts, []);
    const bytes = await generatePptxBuffer(spec, facts);
    return { filename: `${spec.title || "汇报"}.pptx`, bytes };
  }
}

export function createAndGenerateTemplate(input: {
  leaderRequest?: string;
  durationMinutes?: number;
  brief?: unknown;
  useDemo?: boolean;
}): Promise<ProjectDTO> {
  const brief = input.brief ? briefSchema.safeParse(input.brief) : null;
  const materials = brief?.success
    ? brief.data.progress
        .map((item) => `${item.name}｜${item.status}｜${item.owner}｜${item.note}`)
        .join("\n")
    : "";
  return createAndAnalyze({
    reportBackground: input.leaderRequest,
    materials,
    durationMinutes: input.durationMinutes,
    useDemo: input.useDemo,
  });
}
