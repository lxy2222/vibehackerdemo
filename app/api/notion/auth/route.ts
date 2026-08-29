import { oauthConfigured } from "@/lib/notion/config";
import { authorizeUrl } from "@/lib/notion/oauth";
import { setOauthState } from "@/lib/notion/session";
import { jsonError } from "@/lib/http/respond";

export const runtime = "nodejs";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export async function GET(request: Request) {
  if (!oauthConfigured()) {
    return jsonError("还没有配置 Notion OAuth。请在 .env 里填写 NOTION_CLIENT_ID 和 NOTION_CLIENT_SECRET。", 501);
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("return"));
  const state = crypto.randomUUID();
  await setOauthState(state, returnTo);
  return Response.redirect(authorizeUrl(state));
}
