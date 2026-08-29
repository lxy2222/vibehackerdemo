import { jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function PATCH() {
  return jsonError("此步骤已下线，请从首页重新创建汇报模版", 410);
}
