import { auditProjectDto, readProjectDto } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { project?: unknown };
    const current = readProjectDto(body.project);
    if (current.id !== id) {
      return jsonError("项目不存在", 404);
    }
    const project = await auditProjectDto(current);
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "验收失败"), 500);
  }
}
