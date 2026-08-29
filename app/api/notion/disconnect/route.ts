import { clearNotionSession } from "@/lib/notion/session";
import { jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function POST() {
  await clearNotionSession();
  return jsonOk({ connected: false });
}
