import type { Brief } from "@/lib/schemas/brief";
import type { Fact } from "@/lib/presentation/types";
import type { DeckSpec } from "@/lib/schemas/deck";
import type { ReportAnalysis } from "@/lib/schemas/analysis";
import type { AuditReport } from "@/lib/schemas/audit";

export type ProjectStatus = "draft" | "generating" | "ready" | "failed";

export const SESSION_DECK_ID = "session";

export type ProjectDTO = {
  id: string;
  status: ProjectStatus;
  leaderRequest: string;
  durationMinutes: number;
  materials: string;
  brief: Brief | null;
  analysis: ReportAnalysis | null;
  audit: AuditReport | null;
  facts: Fact[];
  deck: DeckSpec | null;
  deckId: string | null;
  errorMessage: string | null;
};
