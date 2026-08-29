import { exchangeCode } from "@/lib/notion/oauth";
import { setNotionAccessToken, takeOauthState } from "@/lib/notion/session";

export const runtime = "nodejs";

function withFlag(path: string, flag: string) {
  const url = path.startsWith("/") ? path : "/";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}notion=${flag}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const { state: expected, returnTo } = await takeOauthState();

  if (!code || !state || !expected || state !== expected) {
    return Response.redirect(new URL(withFlag(returnTo, "error"), url.origin));
  }

  try {
    const token = await exchangeCode(code);
    await setNotionAccessToken(token);
    return Response.redirect(new URL(withFlag(returnTo, "connected"), url.origin));
  } catch {
    return Response.redirect(new URL(withFlag(returnTo, "error"), url.origin));
  }
}
