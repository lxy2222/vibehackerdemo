import { getProjectDTO, saveAnalysis } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProjectDTO(id);
  if (!project) {
    return jsonError("项目不存在", 404);
  }
  return jsonOk(project);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      reportBackground?: string;
      materials?: string;
      analysis?: unknown;
    };
    if (!body.analysis) {
      return jsonError("请填写分析主线");
    }
    const project = await saveAnalysis(id, {
      reportBackground: body.reportBackground,
      materials: body.materials,
      analysis: body.analysis,
    });
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "保存失败"));
  }
}
