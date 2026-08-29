import { jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET() {
  return jsonError("演示草稿只保存在当前浏览器，请从预览页重新导出", 410);
}
