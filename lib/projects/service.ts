import { analyzeNarrative } from "@/lib/llm/analyze-narrative";
import { generateConsultingDeck } from "@/lib/llm/deck";
import { reviseDeckFromFeedback } from "@/lib/llm/revise-deck";
import { generatePptxBuffer } from "@/lib/presentation/generate-pptx";
import { deckFromAnalysis, fitDeckToPageCount, stampDeckDuration } from "@/lib/presentation/from-analysis";
import { INTENT_LABELS, REPORT_INTENTS, reportAnalysisSchema, type ReportAnalysis } from "@/lib/schemas/analysis";
import { DEFAULT_DURATION_MINUTES, durationForIntent } from "@/lib/presentation/limits";
import {
  applyCoverTitle,
  ensureCover,
  isContentFeedback,
  isPptFeedback,
  needsDeckLlm,
  parseCoverTitle,
  parseRequestedPageCount,
  pptNotesFrom,
  PPT_NOTE_PREFIX,
  toPptNote,
  withoutPptNotes,
} from "@/lib/presentation/ppt-feedback";
import type { Fact } from "@/lib/presentation/types";
import { briefSchema } from "@/lib/schemas/brief";
import type { DeckSpec } from "@/lib/schemas/deck";
import { auditProject } from "@/lib/llm/audit";
import { DEMO_MATERIALS, DEMO_REPORT_BACKGROUND } from "@/lib/demo/narrative";
import { SESSION_DECK_ID, type ProjectDTO } from "@/lib/projects/types";

export function readProjectDto(value: unknown): ProjectDTO {
  if (!value || typeof value !== "object") {
    throw new Error("项目不存在");
  }
  const project = value as ProjectDTO;
  if (typeof project.id !== "string" || !project.id) {
    throw new Error("项目不存在");
  }
  if (typeof project.leaderRequest !== "string") {
    throw new Error("项目不存在");
  }
  return project;
}

function requireAnalysis(project: ProjectDTO): ReportAnalysis {
  if (!project.analysis) {
    throw new Error("还没有分析主线，请先确认一句话汇报");
  }
  return project.analysis;
}

async function buildConsultingDeck(input: {
  reportBackground: string;
  materials: string;
  durationMinutes: number;
  analysis: ReportAnalysis;
}): Promise<DeckSpec> {
  try {
    const deck = await generateConsultingDeck(input);
    return stampDeckDuration(deck, INTENT_LABELS[input.analysis.intent], input.durationMinutes);
  } catch {
    return stampDeckDuration(
      deckFromAnalysis({
        reportBackground: input.reportBackground,
        durationMinutes: input.durationMinutes,
        analysis: input.analysis,
      }),
      INTENT_LABELS[input.analysis.intent],
      input.durationMinutes,
    );
  }
}

async function runAnalysis(
  project: ProjectDTO,
  current?: ReportAnalysis,
  lockedIntent?: ReportAnalysis["intent"],
  options?: { generateDeck?: boolean },
): Promise<ProjectDTO> {
  const preservedPpt = pptNotesFrom(current?.excludedDetails ?? []);
  const analysis = await analyzeNarrative({
    reportBackground: project.leaderRequest,
    materials: project.materials,
    durationMinutes: project.durationMinutes,
    current: current
      ? { ...current, excludedDetails: withoutPptNotes(current.excludedDetails) }
      : current,
    lockedIntent,
  });
  analysis.excludedDetails = [...preservedPpt, ...withoutPptNotes(analysis.excludedDetails)];
  const durationMinutes = durationForIntent(analysis.intent, project.durationMinutes);
  const deck = options?.generateDeck
    ? await buildConsultingDeck({
        reportBackground: project.leaderRequest,
        materials: project.materials,
        durationMinutes,
        analysis,
      })
    : null;
  return {
    ...project,
    status: "ready",
    durationMinutes,
    analysis,
    deck,
    facts: [],
    audit: null,
    errorMessage: null,
  };
}

async function applyPptRevision(project: ProjectDTO, feedback: string): Promise<ProjectDTO> {
  const analysis = requireAnalysis(project);
  const durationMinutes = durationForIntent(analysis.intent, project.durationMinutes);
  const base =
    project.deck ??
    deckFromAnalysis({
      reportBackground: project.leaderRequest,
      durationMinutes,
      analysis,
    });
  const pageCount = parseRequestedPageCount(feedback);
  const coverTitle = parseCoverTitle(feedback);
  let deck = base;
  if (needsDeckLlm(feedback)) {
    deck = await reviseDeckFromFeedback({
      feedback,
      analysis,
      current: deck,
      durationMinutes,
      reportBackground: project.leaderRequest,
      materials: project.materials,
    });
  } else {
    deck = ensureCover(deck);
    if (pageCount) {
      deck = fitDeckToPageCount(deck, pageCount);
    }
    if (coverTitle) {
      deck = applyCoverTitle(deck, coverTitle);
    }
  }
  deck = stampDeckDuration(deck, INTENT_LABELS[analysis.intent], durationMinutes);
  return {
    ...project,
    status: "ready",
    analysis: {
      ...analysis,
      excludedDetails: [...withoutPptNotes(analysis.excludedDetails), toPptNote(feedback)],
    },
    deck,
    audit: null,
    errorMessage: null,
  };
}

export async function createAndAnalyze(input: {
  reportBackground?: string;
  leaderRequest?: string;
  materials?: string;
  durationMinutes?: number;
  useDemo?: boolean;
}): Promise<ProjectDTO> {
  const durationMinutes = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : DEFAULT_DURATION_MINUTES;
  const reportBackground = input.useDemo
    ? DEMO_REPORT_BACKGROUND
    : (input.reportBackground ?? input.leaderRequest ?? "").trim();
  const materials = input.useDemo ? DEMO_MATERIALS : (input.materials ?? "").trim();
  if (!reportBackground) {
    throw new Error("请填写一句话汇报");
  }

  const project: ProjectDTO = {
    id: crypto.randomUUID(),
    status: "generating",
    leaderRequest: reportBackground,
    durationMinutes,
    materials,
    brief: null,
    analysis: null,
    audit: null,
    facts: [],
    deck: null,
    deckId: null,
    errorMessage: null,
  };

  return runAnalysis(project);
}

export async function reanalyzeProject(
  project: ProjectDTO,
  input: {
    reportBackground?: string;
    materials?: string;
    analysis?: unknown;
    lockedIntent?: ReportAnalysis["intent"];
  },
): Promise<ProjectDTO> {
  const reportBackground = (input.reportBackground ?? project.leaderRequest).trim();
  const materials = (input.materials ?? project.materials).trim();
  const current = input.analysis
    ? reportAnalysisSchema.parse(input.analysis)
    : (project.analysis ?? undefined);
  const lockedIntent = REPORT_INTENTS.includes(input.lockedIntent as ReportAnalysis["intent"])
    ? (input.lockedIntent as ReportAnalysis["intent"])
    : undefined;
  const seed = lockedIntent && current ? { ...current, intent: lockedIntent } : current;
  if (!reportBackground) {
    throw new Error("请填写一句话汇报");
  }

  return runAnalysis(
    {
      ...project,
      status: "generating",
      leaderRequest: reportBackground,
      materials,
      analysis: seed ?? project.analysis,
      audit: null,
      errorMessage: null,
    },
    seed,
    lockedIntent,
  );
}

export async function saveAnalysis(
  project: ProjectDTO,
  input: { reportBackground?: string; materials?: string; analysis: unknown },
): Promise<ProjectDTO> {
  const analysis = reportAnalysisSchema.parse(input.analysis);
  const reportBackground = (input.reportBackground ?? project.leaderRequest).trim();
  const materials = (input.materials ?? project.materials).trim();
  if (!reportBackground) {
    throw new Error("请填写一句话汇报");
  }
  const durationMinutes = durationForIntent(analysis.intent, project.durationMinutes);
  const deck = await buildConsultingDeck({
    reportBackground,
    materials,
    durationMinutes,
    analysis,
  });

  return {
    ...project,
    status: "ready",
    durationMinutes,
    leaderRequest: reportBackground,
    materials,
    analysis,
    deck,
    facts: [],
    audit: null,
    errorMessage: null,
  };
}

export async function reviseProject(project: ProjectDTO, feedback: string): Promise<ProjectDTO> {
  const trimmed = feedback.trim();
  if (!trimmed) {
    throw new Error("请填写修改意见");
  }

  const current = requireAnalysis(project);
  const ppt = isPptFeedback(trimmed);
  const content = isContentFeedback(trimmed) || !ppt;
  let next: ProjectDTO = { ...project, status: "generating", errorMessage: null };

  if (content) {
    next = await runAnalysis(
      next,
      {
        ...current,
        excludedDetails: [...withoutPptNotes(current.excludedDetails), `用户意见：${trimmed}`],
      },
      undefined,
      { generateDeck: !ppt },
    );
  }
  if (ppt) {
    next = await applyPptRevision(next, trimmed);
  } else {
    const lastPpt = pptNotesFrom(requireAnalysis(next).excludedDetails).at(-1);
    if (lastPpt) {
      next = await applyPptRevision(next, lastPpt.slice(PPT_NOTE_PREFIX.length));
    }
  }
  return next;
}

export function prepareExport(project: ProjectDTO, requestedPageCount: number): ProjectDTO {
  const analysis = project.analysis;
  const durationMinutes = analysis
    ? durationForIntent(analysis.intent, project.durationMinutes)
    : project.durationMinutes;
  let deck = project.deck;
  if (!deck && analysis) {
    deck = deckFromAnalysis({
      reportBackground: project.leaderRequest,
      durationMinutes,
      analysis,
    });
  }
  if (!deck) {
    throw new Error("还没有模版");
  }
  deck = fitDeckToPageCount(deck, requestedPageCount);
  return {
    ...project,
    status: "ready",
    deck,
    deckId: SESSION_DECK_ID,
    errorMessage: null,
  };
}

export async function renderProjectPptx(project: ProjectDTO): Promise<{ filename: string; bytes: Buffer }> {
  if (!project.deck) {
    throw new Error("还没有模版");
  }
  const facts: Fact[] = project.facts ?? [];
  const bytes = await generatePptxBuffer(project.deck, facts);
  if (!bytes.length) {
    throw new Error("已导出的 PPTX 是空文件");
  }
  return { filename: `${project.deck.title || "汇报"}.pptx`, bytes };
}

export async function auditProjectDto(project: ProjectDTO): Promise<ProjectDTO> {
  const report = await auditProject({
    reportBackground: project.leaderRequest,
    materials: project.materials,
    durationMinutes: project.durationMinutes,
    analysis: project.analysis,
    deck: project.deck,
    facts: project.facts,
    pptxBytes: null,
  });

  return {
    ...project,
    status: "ready",
    audit: report,
    errorMessage: null,
  };
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
