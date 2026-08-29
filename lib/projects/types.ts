import type { Brief } from "@/lib/schemas/brief";
import type { Fact } from "@/lib/presentation/types";
import type { DeckSpec } from "@/lib/schemas/deck";

export type ProjectStatus = "draft" | "generating" | "ready" | "failed";

export type FileRecord = {
  id: string;
  projectId: string;
  kind: string;
  filename: string;
  mime: string;
  path: string;
  createdAt: number;
};

export type ProjectRecord = {
  id: string;
  status: ProjectStatus;
  leaderRequest: string;
  durationMinutes: number;
  brief: string | null;
  requirementSpec: string | null;
  clarificationAnswers: string | null;
  columnMapping: string | null;
  facts: string | null;
  notesChunks: string | null;
  deckSpec: string | null;
  deckId: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ProjectDTO = {
  id: string;
  status: ProjectStatus;
  leaderRequest: string;
  durationMinutes: number;
  brief: Brief | null;
  facts: Fact[];
  deck: DeckSpec | null;
  deckId: string | null;
  errorMessage: string | null;
};
