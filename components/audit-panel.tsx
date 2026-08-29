"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/schemas/audit";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn-secondary px-3 py-1.5 text-xs"
      type="button"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "已复制" : "复制一句话汇报"}
    </button>
  );
}

function LineList({ title, items, tone }: { title: string; items: string[]; tone: "block" | "note" }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-1.5 text-sm leading-6">
        {items.map((item, index) => (
          <li
            key={index}
            className={tone === "block" ? "text-[var(--error)]" : "text-[var(--olive)]"}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AuditPanel({
  audit,
  loading,
  onRefresh,
}: {
  audit: AuditReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">下载前验收</h2>
          <p className="mt-1 text-sm text-[var(--olive)]">
            {loading
              ? "正在对照材料和稿子验收…"
              : audit?.status === "ready"
                ? "可提交：没有阻塞项，可以交给领导。"
                : audit
                  ? "需要修改：先处理阻塞项，再验收一次。"
                  : "还没有验收结果。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {audit?.status === "ready" ? (
            <span className="chip-on chip">可提交</span>
          ) : (
            <span className="chip">需要修改</span>
          )}
          <button className="btn-secondary px-3 py-1.5 text-xs" type="button" disabled={loading} onClick={onRefresh}>
            {loading ? "验收中…" : "重新验收"}
          </button>
        </div>
      </div>

      {audit ? (
        <div className="space-y-4">
          <LineList title="阻塞项" items={audit.blockers} tone="block" />
          <LineList title="建议" items={audit.suggestions} tone="note" />
          <LineList title="会上可能被追问" items={audit.likelyFollowups} tone="note" />
          {audit.deliveryMessage ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">一句话汇报</p>
                <CopyButton text={audit.deliveryMessage} />
              </div>
              <p className="rounded-xl bg-white/70 px-3 py-3 text-sm leading-6">{audit.deliveryMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
