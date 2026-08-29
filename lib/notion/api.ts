import { NOTION_VERSION } from "@/lib/notion/config";
import { pageTitle, pageToText } from "@/lib/notion/blocks";

export type NotionPageSummary = {
  id: string;
  title: string;
  url: string;
};

async function notionFetch(token: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Notion 请求失败 (${response.status})`);
  }
  return response.json() as Promise<unknown>;
}

export async function getWorkspaceName(token: string) {
  const data = (await notionFetch(token, "/users/me")) as {
    name?: string;
    bot?: { workspace_name?: string };
  };
  return data.bot?.workspace_name || data.name || "Notion";
}

export async function searchPages(token: string, query = ""): Promise<NotionPageSummary[]> {
  const data = (await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      page_size: 20,
      filter: { property: "object", value: "page" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
    }),
  })) as {
    results?: Array<{
      id: string;
      url?: string;
      properties?: Record<string, { type?: string; title?: { plain_text?: string }[] }>;
    }>;
  };

  return (data.results ?? []).map((page) => ({
    id: page.id,
    title: pageTitle(page),
    url: page.url ?? `https://www.notion.so/${page.id.replaceAll("-", "")}`,
  }));
}

export async function importPages(token: string, pageIds: string[]) {
  const sections: string[] = [];
  const sources: NotionPageSummary[] = [];

  for (const pageId of pageIds) {
    const page = (await notionFetch(token, `/pages/${pageId}`)) as {
      id: string;
      url?: string;
      properties?: Record<string, { type?: string; title?: { plain_text?: string }[] }>;
    };
    const title = pageTitle(page);
    const url = page.url ?? `https://www.notion.so/${page.id.replaceAll("-", "")}`;
    const body = await pageToText(token, pageId);
    sources.push({ id: page.id, title, url });
    sections.push(`# ${title}\n来源：${url}\n\n${body}`.trim());
  }

  return {
    text: sections.join("\n\n---\n\n"),
    sources,
  };
}
