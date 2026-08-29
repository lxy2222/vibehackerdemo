import { clampPageCount, DEFAULT_PAGE_COUNT } from "@/lib/presentation/limits";
import { exportProjectPptx } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { pageCount?: number };
    const project = await exportProjectPptx(id, clampPageCount(body.pageCount ?? DEFAULT_PAGE_COUNT));
    return jsonOk(project);
  } catch (error) {
    return jsonError(errorMessage(error, "导出 PPT 失败"), 500);
  }
}
