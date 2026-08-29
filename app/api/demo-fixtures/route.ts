import { DEMO_MATERIALS, DEMO_REPORT_BACKGROUND } from "@/lib/demo/narrative";
import { jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    reportBackground: DEMO_REPORT_BACKGROUND,
    materials: DEMO_MATERIALS,
    durationMinutes: 10,
  });
}
