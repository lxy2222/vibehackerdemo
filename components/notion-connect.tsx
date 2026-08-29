"use client";

import { useEffect, useState, useTransition } from "react";

type NotionPage = {
  id: string;
  title: string;
  url: string;
};

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

function NotionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#111111" />
      <path
        d="M8 7.5h6.2c1.6 0 2.6 1 2.6 2.5 0 1.1-.5 1.9-1.4 2.3.9.4 1.5 1.3 1.5 2.5 0 1.7-1.2 2.7-3 2.7H8V7.5Zm2.2 1.8v2.6h3.1c.6 0 1-.4 1-1.1 0-.7-.4-1.1-1-1.1H10.2h.0Zm0 4.3v2.8h3.4c.7 0 1.1-.4 1.1-1.2 0-.8-.4-1.2-1.1-1.2H10.2Z"
        fill="#fcffff"
      />
    </svg>
  );
}

export function NotionConnect({
  returnTo,
  onImported,
  onBeforeConnect,
}: {
  returnTo: string;
  onImported: (text: string, sources: NotionPage[]) => void;
  onBeforeConnect?: () => void;
}) {
  const [connected, setConnected] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [importing, startImport] = useTransition();

  async function refreshStatus() {
    const response = await fetch("/api/notion/status");
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as {
      connected: boolean;
      oauthConfigured: boolean;
      workspace: string | null;
    };
    setConnected(data.connected);
    setOauthConfigured(data.oauthConfigured);
    setWorkspace(data.workspace);
    return data.connected;
  }

  async function refreshPages() {
    const response = await fetch("/api/notion/pages");
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    const data = (await response.json()) as { pages: NotionPage[] };
    setPages(data.pages);
  }

  useEffect(() => {
    startLoading(async () => {
      const params = new URLSearchParams(window.location.search);
      const flag = params.get("notion");
      const isConnected = await refreshStatus();
      if (flag === "connected" || isConnected) {
        await refreshPages();
      }
      if (flag === "error") {
        setError("Notion 授权没有完成，请再试一次。");
      }
      if (flag) {
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", clean);
      }
    });
  }, []);

  function connect() {
    if (!oauthConfigured) {
      setError("还没有配置 Notion OAuth。在 Notion 创建一个 Public integration，把 Client ID / Secret 写进 .env。");
      return;
    }
    onBeforeConnect?.();
    window.location.href = `/api/notion/auth?return=${encodeURIComponent(returnTo)}`;
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function importSelected() {
    startImport(async () => {
      setError(null);
      const response = await fetch("/api/notion/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds: selected }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as { text: string; sources: NotionPage[] };
      onImported(data.text, data.sources);
      setMessage(`已导入 ${data.sources.length} 个页面，可继续改材料。`);
    });
  }

  async function disconnect() {
    await fetch("/api/notion/disconnect", { method: "POST" });
    setConnected(false);
    setWorkspace(null);
    setPages([]);
    setSelected([]);
  }

  return (
    <section className="space-y-3 rounded-2xl bg-[var(--lavender)]/45 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <NotionIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium">连接你的 Notion</p>
          <p className="mt-1 text-base leading-7 text-[var(--olive)]">
            {connected
              ? `已连接${workspace ? `「${workspace}」` : ""}。勾选页面后导入为汇报材料。`
              : "点击后打开 Notion 授权。授权时勾选要分享的页面，回来就能选择导入。"}
          </p>
        </div>
        {connected ? (
          <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => void disconnect()}>
            断开
          </button>
        ) : (
          <button className="btn-primary px-3 py-2 text-xs" type="button" onClick={connect}>
            去授权
          </button>
        )}
      </div>

      {connected ? (
        <div className="space-y-3">
          <ul className="max-h-56 space-y-2 overflow-auto">
            {pages.length === 0 ? (
              <li className="text-sm text-[var(--olive)]">
                {loading ? "正在读取页面…" : "没有可导入的页面。授权时需要勾选页面，或把页面分享给这个集成。"}
              </li>
            ) : (
              pages.map((page) => {
                const on = selected.includes(page.id);
                return (
                  <li key={page.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(page.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{page.title}</span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
          <button
            className="btn-secondary"
            type="button"
            disabled={importing || selected.length === 0}
            onClick={importSelected}
          >
            {importing ? "正在导入…" : `导入所选页面（${selected.length}）`}
          </button>
        </div>
      ) : null}

      {message ? <p className="text-sm text-[var(--olive)]">{message}</p> : null}
      {error ? <p className="notice-error">{error}</p> : null}
    </section>
  );
}
