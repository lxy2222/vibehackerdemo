import { jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function POST() {
  return jsonError("请从预览页重新导出 PPT", 410);
}
