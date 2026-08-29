"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { factMap, interpolate } from "@/lib/presentation/facts";
import type { ProjectDTO } from "@/lib/projects/types";
import { findNakedNumbers } from "@/lib/validation/deck";

const TYPE_LABEL: Record<string, string> = {
  cover: "封面",
  executive_summary: "核心结论",
  kpi_overview: "指标总览",
  trend: "趋势",
  comparison: "对比",
  diagnosis: "问题与原因",
  recommendations: "建议",
  action_plan: "行动计划",
};

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function OutlineForm({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const facts = factMap(project.facts);
  const [slides, setSlides] = useState(
    (project.deck?.slides ?? []).map((slide) => ({
      id: slide.id,
      type: slide.type,
      headline: slide.headline,
      takeaway: slide.takeaway,
      bullets: slide.bullets,
      factRefs: slide.factRefs,
    })),
  );
  const [error, setError] = useState<string | null>(project.errorMessage);
  const [pending, startTransition] = useTransition();

  if (!project.deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700">还没有大纲，请先确认需求。</p>
        <a className="btn-secondary" href={`/projects/${project.id}/clarify`}>
          返回确认需求
        </a>
      </div>
    );
  }

  function submit() {
    const naked = slides.flatMap((slide) =>
      [slide.headline, slide.takeaway].flatMap(findNakedNumbers),
    );
    if (naked.length > 0) {
      setError(`请不要手填裸数字：${naked.join("、")}`);
      return;
    }

    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: slides.map((slide) => ({
            id: slide.id,
            headline: slide.headline,
            takeaway: slide.takeaway,
          })),
        }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      router.push(`/projects/${project.id}/download`);
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="text-sm text-[var(--olive)]">
        可以改标题和结论，数字只能保留 {`{{fact_id}}`} 占位符。
      </p>

      {slides.map((slide, index) => (
        <section
          key={slide.id}
          className="space-y-3 rounded-2xl bg-[var(--lavender)]/40 p-4"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[var(--primary)]">
              {index + 1}. {TYPE_LABEL[slide.type] ?? slide.type}
            </span>
            {slide.factRefs.length > 0 ? (
              <span className="text-[var(--muted)]">{slide.factRefs.length} 条事实</span>
            ) : null}
          </div>
          <input
            className="field"
            maxLength={24}
            value={slide.headline}
            onChange={(event) => {
              const next = [...slides];
              next[index] = { ...slide, headline: event.target.value };
              setSlides(next);
            }}
          />
          <textarea
            className="field min-h-20"
            value={slide.takeaway}
            onChange={(event) => {
              const next = [...slides];
              next[index] = { ...slide, takeaway: event.target.value };
              setSlides(next);
            }}
          />
          {slide.takeaway.includes("{{") ? (
            <p className="text-sm text-[var(--primary)]">
              预览：{interpolate(slide.takeaway, facts)}
            </p>
          ) : null}
          {slide.bullets.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--olive)]">
              {slide.bullets.map((bullet) => (
                <li key={bullet}>{interpolate(bullet, facts)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "正在生成 PPT…" : "生成 PPT"}
      </button>
    </form>
  );
}
