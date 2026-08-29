type RichText = { plain_text?: string };

type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

function plain(items: RichText[] | undefined) {
  return (items ?? []).map((item) => item.plain_text ?? "").join("");
}

function blockText(block: NotionBlock) {
  const type = block.type;
  const payload = block[type] as { rich_text?: RichText[]; language?: string } | undefined;
  const text = plain(payload?.rich_text);
  switch (type) {
    case "heading_1":
      return text ? `# ${text}` : "";
    case "heading_2":
      return text ? `## ${text}` : "";
    case "heading_3":
      return text ? `### ${text}` : "";
    case "bulleted_list_item":
      return text ? `- ${text}` : "";
    case "numbered_list_item":
      return text ? `1. ${text}` : "";
    case "to_do":
      return text ? `- ${text}` : "";
    case "quote":
      return text ? `> ${text}` : "";
    case "code":
      return text ? text : "";
    case "callout":
    case "paragraph":
    case "toggle":
      return text;
    default:
      return text;
  }
}

export async function fetchBlockChildren(token: string, blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) {
      url.searchParams.set("start_cursor", cursor);
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!response.ok) {
      throw new Error(`读取 Notion 页面失败 (${response.status})`);
    }
    const data = (await response.json()) as {
      results?: NotionBlock[];
      next_cursor?: string | null;
      has_more?: boolean;
    };
    blocks.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);
  return blocks;
}

export async function pageToText(token: string, pageId: string, depth = 0): Promise<string> {
  if (depth > 3) {
    return "";
  }
  const blocks = await fetchBlockChildren(token, pageId);
  const lines: string[] = [];
  for (const block of blocks) {
    const text = blockText(block);
    if (text) {
      lines.push(text);
    }
    if (block.has_children) {
      const child = await pageToText(token, block.id, depth + 1);
      if (child) {
        lines.push(child);
      }
    }
  }
  return lines.join("\n");
}

export function pageTitle(page: {
  properties?: Record<string, { type?: string; title?: RichText[] }>;
}) {
  const properties = page.properties ?? {};
  for (const value of Object.values(properties)) {
    if (value.type === "title") {
      const title = plain(value.title);
      if (title) {
        return title;
      }
    }
  }
  return "无标题页面";
}
