import {
  notionClientId,
  notionClientSecret,
  notionRedirectUri,
} from "@/lib/notion/config";

export function authorizeUrl(state: string) {
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", notionClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", notionRedirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCode(code: string) {
  const basic = Buffer.from(`${notionClientId()}:${notionClientSecret()}`).toString("base64");
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: notionRedirectUri(),
    }),
  });
  if (!response.ok) {
    throw new Error(`Notion 授权失败 (${response.status})`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Notion 没有返回 access token");
  }
  return data.access_token;
}
