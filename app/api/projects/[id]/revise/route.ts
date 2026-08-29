import { reviseProject } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { feedback?: string };
    const project = await reviseProject(id, body.feedback ?? "");
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "按意见重生成失败"), 500);
  }
}
