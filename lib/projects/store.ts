import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/index";
import { decks, files, projects } from "@/lib/db/schema";
import type { FileRecord, ProjectRecord, ProjectStatus } from "@/lib/projects/types";

function now() {
  return Date.now();
}

export function createProjectRow(input: {
  leaderRequest: string;
  durationMinutes: number;
  brief: string;
}): ProjectRecord {
  const id = crypto.randomUUID();
  const createdAt = now();
  getDb()
    .insert(projects)
    .values({
      id,
      status: "draft",
      leaderRequest: input.leaderRequest,
      durationMinutes: input.durationMinutes,
      brief: input.brief,
      createdAt,
      updatedAt: createdAt,
    })
    .run();
  return getProjectRow(id)!;
}

export function getProjectRow(id: string): ProjectRecord | null {
  const row = getDb().select().from(projects).where(eq(projects.id, id)).get();
  return row ? (row as ProjectRecord) : null;
}

export function listProjectFiles(projectId: string): FileRecord[] {
  return getDb().select().from(files).where(eq(files.projectId, projectId)).all() as FileRecord[];
}

export function insertFileRow(row: Omit<FileRecord, "createdAt"> & { createdAt?: number }) {
  const createdAt = row.createdAt ?? now();
  getDb()
    .insert(files)
    .values({
      id: row.id,
      projectId: row.projectId,
      kind: row.kind,
      filename: row.filename,
      mime: row.mime,
      path: row.path,
      createdAt,
    })
    .run();
}

export function updateProjectRow(
  id: string,
  patch: Partial<
    Omit<ProjectRecord, "id" | "createdAt"> & { status: ProjectStatus }
  >,
) {
  getDb()
    .update(projects)
    .set({ ...patch, updatedAt: now() })
    .where(eq(projects.id, id))
    .run();
}

export function insertDeckRow(row: {
  id: string;
  projectId: string;
  spec: string;
  facts: string;
  pptxPath: string;
}) {
  getDb()
    .insert(decks)
    .values({
      ...row,
      createdAt: now(),
    })
    .run();
}

export function getDeckRow(id: string) {
  return getDb().select().from(decks).where(eq(decks.id, id)).get() ?? null;
}
