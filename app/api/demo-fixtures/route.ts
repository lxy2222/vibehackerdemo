import { getAuditCase } from "@/lib/demo/audit-cases";
import { jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fixture = getAuditCase(url.searchParams.get("case"));
  return jsonOk({
    id: fixture.id,
    label: fixture.label,
    hint: fixture.hint,
    reportBackground: fixture.reportBackground,
    materials: fixture.materials,
    durationMinutes: fixture.durationMinutes,
  });
}
