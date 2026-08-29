export const NOTION_VERSION = "2022-06-28";
export const TOKEN_COOKIE = "notion_access_token";
export const STATE_COOKIE = "notion_oauth_state";
export const RETURN_COOKIE = "notion_oauth_return";

export function notionClientId() {
  return process.env.NOTION_CLIENT_ID?.trim() ?? "";
}

export function notionClientSecret() {
  return process.env.NOTION_CLIENT_SECRET?.trim() ?? "";
}

export function notionRedirectUri() {
  return (
    process.env.NOTION_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/notion/callback"
  );
}

export function notionInternalToken() {
  return process.env.NOTION_API_KEY?.trim() ?? "";
}

export function oauthConfigured() {
  return Boolean(notionClientId() && notionClientSecret());
}
