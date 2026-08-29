import { cookies } from "next/headers";
import {
  notionInternalToken,
  RETURN_COOKIE,
  STATE_COOKIE,
  TOKEN_COOKIE,
} from "@/lib/notion/config";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getNotionAccessToken() {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value || notionInternalToken() || "";
}

export async function setNotionAccessToken(token: string) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, token, { ...cookieBase(), maxAge: THIRTY_DAYS });
}

export async function clearNotionSession() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(STATE_COOKIE);
  jar.delete(RETURN_COOKIE);
}

export async function setOauthState(state: string, returnTo: string) {
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, { ...cookieBase(), maxAge: 600 });
  jar.set(RETURN_COOKIE, returnTo, { ...cookieBase(), maxAge: 600 });
}

export async function takeOauthState() {
  const jar = await cookies();
  const state = jar.get(STATE_COOKIE)?.value ?? "";
  const returnTo = jar.get(RETURN_COOKIE)?.value ?? "/";
  jar.delete(STATE_COOKIE);
  jar.delete(RETURN_COOKIE);
  return { state, returnTo };
}
