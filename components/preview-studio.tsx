"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuditPanel } from "@/components/audit-panel";
import { SlidePreview } from "@/components/slide-preview";
import { clampPageCount, DEFAULT_PAGE_COUNT, MAX_PAGE_COUNT } from "@/lib/presentation/limits";
import type { AuditReport } from "@/lib/schemas/audit";
import type { ProjectDTO } from "@/lib/projects/types";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function PreviewStudio({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const slideCount = clampPageCount(project.deck?.slides.length ?? DEFAULT_PAGE_COUNT);
  const [feedback, setFeedback] = useState("");
  const [pageCount, setPageCount] = useState(slideCount);
  const [seenSlideCount, setSeenSlideCount] = useState(slideCount);
  const [pageCountTouched, setPageCountTouched] = useState(false);
  const [error, setError] = useState<string | null>(project.errorMessage);
  const [audit, setAudit] = useState<AuditReport | null>(project.audit);
  const [pending, startTransition] = useTransition();
  const [exporting, startExport] = useTransition();
  const [auditing, startAudit] = useTransition();

  if (slideCount !== seenSlideCount) {
    setSeenSlideCount(slideCount);
    if (!pageCountTouched) {
      setPageCount(slideCount);
    }
  }

  useEffect(() => {
    setAudit(project.audit);
  }, [project.audit]);

  function runAudit() {
    startAudit(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}/audit`, { method: "POST" });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const next = (await response.json()) as ProjectDTO;
      setAudit(next.audit);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!project.deck || project.audit || audit || auditing) {
      return;
    }
    runAudit();
  }, [project.id, Boolean(project.deck), Boolean(project.audit), Boolean(audit), auditing]);

  const deck = project.deck;
  if (!deck) {
    return (
      <div className="space-y-4">
        <p className="notice-error">{project.errorMessage ?? "还没有模版"}</p>
        <a className="btn-secondary" href={`/projects/${project.id}/outline`}>
          返回确认主线
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
      setAudit(null);
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

      <AuditPanel audit={audit} loading={auditing} onRefresh={runAudit} />

      <section className="panel space-y-3 p-5">
        <h2 className="text-sm font-medium">不满意？写意见重生成</h2>
        <textarea
          className="field min-h-24"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="例如：只要两页、封面标题改成跨国家复用、结论再锋利一点、版式改成指标卡片"
        />
        <button className="btn-primary" type="button" disabled={pending || !feedback.trim()} onClick={revise}>
          {pending ? "正在按意见重生成…" : "按意见重生成"}
        </button>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-sm font-medium">可选：导出 PPT</h2>
        <p className="text-sm text-[var(--olive)]">
          {audit?.status === "needs_revision"
            ? "还有阻塞项。可以先改主线或按意见重生成，仍要导出也可以。"
            : "指定页数后生成可编辑 PPTX。网页预览已经可以开会用。"}
        </p>
        <label className="block max-w-40 space-y-2 text-sm">
          <span className="font-medium">页数（1–{MAX_PAGE_COUNT}）</span>
          <input
            className="field"
            type="number"
            min={1}
            max={MAX_PAGE_COUNT}
            value={pageCount}
            onChange={(event) => {
              setPageCountTouched(true);
              setPageCount(clampPageCount(Number(event.target.value) || MAX_PAGE_COUNT));
            }}
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

      {error ? <p className="notice-error">{error}</p> : null}
    </div>
  );
}
