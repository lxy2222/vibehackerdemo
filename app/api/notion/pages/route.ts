import { importPages, searchPages } from "@/lib/notion/api";
import { getNotionAccessToken } from "@/lib/notion/session";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const token = await getNotionAccessToken();
  if (!token) {
    return jsonError("还没有连接 Notion", 401);
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const pages = await searchPages(token, query);
    return jsonOk({ pages });
  } catch (error) {
    return jsonError(errorMessage(error, "搜索 Notion 页面失败"), 500);
  }
}

export async function POST(request: Request) {
  const token = await getNotionAccessToken();
  if (!token) {
    return jsonError("还没有连接 Notion", 401);
  }

  const body = (await request.json().catch(() => ({}))) as { pageIds?: string[] };
  const pageIds = (body.pageIds ?? []).filter(Boolean);
  if (pageIds.length === 0) {
    return jsonError("请先选择页面");
  }

  try {
    const imported = await importPages(token, pageIds);
    return jsonOk(imported);
  } catch (error) {
    return jsonError(errorMessage(error, "导入 Notion 页面失败"), 500);
  }
}
