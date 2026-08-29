import { readProjectDto, saveAnalysis } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      project?: unknown;
      reportBackground?: string;
      materials?: string;
      analysis?: unknown;
    };
    if (!body.analysis) {
      return jsonError("请填写分析主线");
    }
    const current = readProjectDto(body.project);
    if (current.id !== id) {
      return jsonError("项目不存在", 404);
    }
    const project = await saveAnalysis(current, {
      reportBackground: body.reportBackground,
      materials: body.materials,
      analysis: body.analysis,
    });
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "保存失败"));
  }
}
