import fs from "node:fs/promises";
import { factsFromBrief } from "@/lib/facts/from-brief";
import { generateDeckSpec, resizeDeckSpec, reviseDeckSpec } from "@/lib/llm/deck";
import { generatePptxBuffer } from "@/lib/presentation/generate-pptx";
import type { Fact } from "@/lib/presentation/types";
import { briefSchema, type Brief } from "@/lib/schemas/brief";
import type { DeckSpec } from "@/lib/schemas/deck";
import { getDemoBrief, DEMO_LEADER_REQUEST } from "@/lib/demo/brief";
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

export function toDTO(project: ProjectRecord): ProjectDTO {
  return {
    id: project.id,
    status: asStatus(project.status),
    leaderRequest: project.leaderRequest,
    durationMinutes: project.durationMinutes,
    brief: parseJson<Brief | null>(project.brief, null),
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

function requireBrief(project: ProjectRecord): Brief {
  const parsed = briefSchema.safeParse(parseJson(project.brief, null));
  if (!parsed.success) {
    throw new Error("缺少漏斗或进度信息，请重新创建");
  }
  return parsed.data;
}

export async function createAndGenerateTemplate(input: {
  leaderRequest?: string;
  durationMinutes?: number;
  brief?: unknown;
  useDemo?: boolean;
}): Promise<ProjectDTO> {
  const durationMinutes = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 10;
  const brief = input.useDemo ? getDemoBrief() : briefSchema.parse(input.brief);
  const leaderRequest = input.useDemo
    ? DEMO_LEADER_REQUEST
    : (input.leaderRequest ?? "").trim();
  if (!leaderRequest) {
    throw new Error("请填写汇报原话");
  }

  const facts = factsFromBrief(brief);
  const project = createProjectRow({
    leaderRequest,
    durationMinutes,
    brief: JSON.stringify(brief),
  });

  updateProjectRow(project.id, {
    status: "generating",
    facts: JSON.stringify(facts),
    errorMessage: null,
  });

  try {
    const deck = await generateDeckSpec({
      leaderRequest,
      durationMinutes,
      brief,
      facts,
    });
    updateProjectRow(project.id, {
      status: "ready",
      facts: JSON.stringify(facts),
      deckSpec: JSON.stringify(deck),
      errorMessage: null,
    });
    return getProjectDTO(project.id)!;
  } catch (error) {
    updateProjectRow(project.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "生成模版失败",
    });
    throw error;
  }
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

  const brief = requireBrief(project);
  const facts = parseJson<Fact[]>(project.facts, factsFromBrief(brief));
  const current = parseJson<DeckSpec | null>(project.deckSpec, null);
  if (!current) {
    throw new Error("还没有模版");
  }

  updateProjectRow(projectId, { status: "generating", errorMessage: null });

  try {
    const deck = await reviseDeckSpec({
      leaderRequest: project.leaderRequest,
      durationMinutes: project.durationMinutes,
      brief,
      facts,
      current,
      feedback: trimmed,
    });
    updateProjectRow(projectId, {
      status: "ready",
      deckSpec: JSON.stringify(deck),
      errorMessage: null,
    });
    return getProjectDTO(projectId)!;
  } catch (error) {
    updateProjectRow(projectId, {
      status: "ready",
      errorMessage: error instanceof Error ? error.message : "按意见重生成失败",
    });
    throw error;
  }
}

export async function exportProjectPptx(projectId: string, pageCount: number): Promise<ProjectDTO> {
  const project = getProjectRow(projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  const count = Math.min(12, Math.max(4, Math.round(pageCount)));
  const brief = requireBrief(project);
  const facts = parseJson<Fact[]>(project.facts, factsFromBrief(brief));
  let deck = parseJson<DeckSpec | null>(project.deckSpec, null);
  if (!deck) {
    throw new Error("还没有模版");
  }

  updateProjectRow(projectId, { status: "generating", errorMessage: null });

  try {
    if (deck.slides.length !== count) {
      deck = await resizeDeckSpec({
        leaderRequest: project.leaderRequest,
        durationMinutes: project.durationMinutes,
        brief,
        facts,
        current: deck,
        pageCount: count,
      });
    }

    const buffer = await generatePptxBuffer(deck, facts);
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
