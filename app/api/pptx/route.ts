import { prepareExport, readProjectDto, renderProjectPptx } from "@/lib/projects/service";
import { clampPageCount, DEFAULT_PAGE_COUNT } from "@/lib/presentation/limits";
import { errorMessage, jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      project?: unknown;
      pageCount?: number;
    };
    const current = readProjectDto(body.project);
    const project = prepareExport(current, clampPageCount(body.pageCount ?? DEFAULT_PAGE_COUNT));
    const { filename, bytes } = await renderProjectPptx(project);
    const ascii = "review.pptx";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(errorMessage(error, "导出 PPT 失败"), 500);
  }
}
