import { reanalyzeProject } from "@/lib/projects/service";
import type { ReportAnalysis } from "@/lib/schemas/analysis";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      reportBackground?: string;
      materials?: string;
      analysis?: unknown;
      lockedIntent?: unknown;
    };
    const project = await reanalyzeProject(id, {
      reportBackground: body.reportBackground,
      materials: body.materials,
      analysis: body.analysis,
      lockedIntent:
        typeof body.lockedIntent === "string" ? (body.lockedIntent as ReportAnalysis["intent"]) : undefined,
    });
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "重新分析失败"), 500);
  }
}
