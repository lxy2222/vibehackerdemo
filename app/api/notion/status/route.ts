import { oauthConfigured } from "@/lib/notion/config";
import { getWorkspaceName } from "@/lib/notion/api";
import { getNotionAccessToken } from "@/lib/notion/session";
import { jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";

export async function GET() {
  const token = await getNotionAccessToken();
  if (!token) {
    return jsonOk({
      connected: false,
      oauthConfigured: oauthConfigured(),
      workspace: null,
    });
  }

  try {
    const workspace = await getWorkspaceName(token);
    return jsonOk({
      connected: true,
      oauthConfigured: oauthConfigured(),
      workspace,
    });
  } catch {
    return jsonOk({
      connected: false,
      oauthConfigured: oauthConfigured(),
      workspace: null,
    });
  }
}
