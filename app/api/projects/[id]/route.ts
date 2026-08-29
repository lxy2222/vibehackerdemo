import { getProjectDTO } from "@/lib/projects/service";
import { jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

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
