import { generateDemoPptx } from "@/lib/presentation/generate-pptx";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const emptyDataSlides = url.searchParams.get("empty") === "1";
  const buffer = await generateDemoPptx({ emptyDataSlides });
  const filename = emptyDataSlides
    ? "q2-review-missing-data.pptx"
    : "q2-review-demo.pptx";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
