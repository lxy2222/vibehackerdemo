import { readProjectDto, reanalyzeProject } from "@/lib/projects/service";
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
      project?: unknown;
      reportBackground?: string;
      materials?: string;
      analysis?: unknown;
      lockedIntent?: unknown;
    };
    const current = readProjectDto(body.project);
    if (current.id !== id) {
      return jsonError("项目不存在", 404);
    }
    const project = await reanalyzeProject(current, {
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
