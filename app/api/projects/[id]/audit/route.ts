import { auditProjectById } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const project = await auditProjectById(id);
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "验收失败"), 500);
  }
}
