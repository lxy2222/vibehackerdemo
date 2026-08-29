"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidePreview } from "@/components/slide-preview";
import type { ProjectDTO } from "@/lib/projects/types";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function PreviewStudio({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [pageCount, setPageCount] = useState(project.deck?.slides.length ?? 6);
  const [error, setError] = useState<string | null>(project.errorMessage);
  const [pending, startTransition] = useTransition();
  const [exporting, startExport] = useTransition();

  const deck = project.deck;
  if (!deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700">{project.errorMessage ?? "还没有模版"}</p>
        <a className="btn-secondary" href="/">
          返回创建
        </a>
      </div>
    );
  }

  function revise() {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setFeedback("");
      router.refresh();
    });
  }

  function exportPptx() {
    startExport(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageCount }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const next = (await response.json()) as { deckId?: string };
      if (next.deckId) {
        window.location.href = `/api/decks/${next.deckId}/download`;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {deck.slides.map((slide, index) => (
          <SlidePreview
            key={slide.id}
            slide={slide}
            subtitle={deck.subtitle}
            facts={project.facts}
            index={index}
            total={deck.slides.length}
          />
        ))}
      </div>

      <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-sm font-medium">不满意？写意见重生成</h2>
        <textarea
          className="field min-h-24"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="例如：漏斗太细了、进度写轻了、技术实现再少讲一点"
        />
        <button className="btn-primary" type="button" disabled={pending || !feedback.trim()} onClick={revise}>
          {pending ? "正在按意见重生成…" : "按意见重生成"}
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-sm font-medium">可选：导出 PPT</h2>
        <p className="text-sm text-[#3d2a45]/70">指定页数后生成可编辑 PPTX。网页预览已经可以开会用。</p>
        <label className="block max-w-40 space-y-2 text-sm">
          <span className="font-medium">页数（4–12）</span>
          <input
            className="field"
            type="number"
            min={4}
            max={12}
            value={pageCount}
            onChange={(event) => setPageCount(Number(event.target.value) || 6)}
          />
        </label>
        <button className="btn-secondary" type="button" disabled={exporting} onClick={exportPptx}>
          {exporting ? "正在导出…" : "生成并下载 PPT"}
        </button>
        {project.deckId ? (
          <p className="text-sm">
            已有文件可{" "}
            <a className="underline" href={`/api/decks/${project.deckId}/download`}>
              再次下载
            </a>
            。
          </p>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
