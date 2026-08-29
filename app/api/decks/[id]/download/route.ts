import { readDeckPptx } from "@/lib/projects/service";
import { errorMessage, jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { filename, bytes } = await readDeckPptx(id);
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
    return jsonError(errorMessage(error, "下载失败"), 404);
  }
}
