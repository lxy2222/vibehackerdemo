type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function completionsUrl(): string {
  const root = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(
    /\/$/,
    "",
  );
  return root.endsWith("/chat/completions")
    ? root
    : `${root}/chat/completions`;
}

export async function completeJson(options: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY");
  }

  const response = await fetch(completionsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    throw new Error(`模型请求失败 (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型返回空内容");
  }

  return JSON.parse(content) as unknown;
}

export async function completeJsonWithRetry<T>(
  options: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
  },
  parse: (value: unknown) => T,
): Promise<T> {
  try {
    return parse(await completeJson(options));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    return parse(
      await completeJson({
        ...options,
        messages: [
          ...options.messages,
          {
            role: "user",
            content: `上次输出不是合法 json 或未通过校验：${detail}。请只返回一个 json 对象，不要 markdown。`,
          },
        ],
      }),
    );
  }
}

export function flashModel(): string {
  return process.env.DEEPSEEK_MODEL_FLASH ?? "deepseek-v4-flash";
}

export function proModel(): string {
  return process.env.DEEPSEEK_MODEL_PRO ?? "deepseek-v4-pro";
}
