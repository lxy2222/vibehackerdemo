import { getDemoBrief, DEMO_LEADER_REQUEST } from "@/lib/demo/brief";
import { jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    leaderRequest: DEMO_LEADER_REQUEST,
    durationMinutes: 10,
    brief: getDemoBrief(),
  });
}
