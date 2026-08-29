"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { NotionConnect } from "@/components/notion-connect";
import { VoiceTextarea } from "@/components/voice-textarea";
import type { AuditCaseId } from "@/lib/demo/audit-cases";
import { clearCreateDraft, loadCreateDraft, saveCreateDraft } from "@/lib/draft/form-draft";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function CreateForm() {
  const router = useRouter();
  const [reportBackground, setReportBackground] = useState("");
  const [materials, setMaterials] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [loadedCase, setLoadedCase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const draft = loadCreateDraft();
    if (!draft) {
      return;
    }
    setReportBackground(draft.reportBackground);
    setMaterials(draft.materials);
    setDurationMinutes(draft.durationMinutes ?? 5);
  }, []);

  function persistDraft(next?: Partial<{ reportBackground: string; materials: string; durationMinutes: number }>) {
    saveCreateDraft({
      reportBackground: next?.reportBackground ?? reportBackground,
      materials: next?.materials ?? materials,
      durationMinutes: next?.durationMinutes ?? durationMinutes,
    });
  }

  async function loadCase(id: AuditCaseId) {
    setError(null);
    const response = await fetch(`/api/demo-fixtures?case=${id}`);
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    const data = (await response.json()) as {
      label: string;
      hint: string;
      reportBackground: string;
      materials: string;
      durationMinutes: number;
    };
    setReportBackground(data.reportBackground);
    setMaterials(data.materials);
    setDurationMinutes(data.durationMinutes);
    setLoadedCase(`${data.label}：${data.hint}`);
    persistDraft({
      reportBackground: data.reportBackground,
      materials: data.materials,
      durationMinutes: data.durationMinutes,
    });
  }

  function submit() {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportBackground,
            materials,
            durationMinutes,
          }),
        });
        if (!response.ok) {
          setError(await readError(response));
          return;
        }
        const project = (await response.json()) as { id: string };
        clearCreateDraft();
        router.push(`/projects/${project.id}/outline`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分析失败");
      }
    });
  }

  return (
    <form
      className="panel space-y-8 p-8"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <VoiceTextarea
        label="我最初的汇报背景"
        value={reportBackground}
        onChange={(next) => {
          setReportBackground(next);
          setLoadedCase(null);
          persistDraft({ reportBackground: next });
        }}
        placeholder="写下或口述这次想讲什么、给谁讲、现在卡在哪，例如周五给管理层五分钟，重点讲复用后的交付效率"
        required
        minClassName="min-h-48"
      />

      <div className="space-y-3">
        <span className="text-base font-medium">工作对话或材料</span>
        <NotionConnect
          returnTo="/"
          onBeforeConnect={() => persistDraft()}
          onImported={(text) => {
            setMaterials((current) => {
              const next = current.trim() ? `${current.trim()}\n\n${text}` : text;
              persistDraft({ materials: next });
              return next;
            });
            setLoadedCase(null);
          }}
        />
        <textarea
          className="field min-h-48"
          value={materials}
          onChange={(event) => {
            setMaterials(event.target.value);
            setLoadedCase(null);
            persistDraft({ materials: event.target.value });
          }}
          placeholder="粘贴一段工作沟通、会议记录，或先连接 Notion 导入页面。"
        />
      </div>
      </div>

      <label className="block max-w-xs space-y-2 text-base">
        <span className="font-medium">汇报时长（分钟，可选）</span>
        <input
          className="field max-w-40"
          type="number"
          min={1}
          max={90}
          value={durationMinutes}
          onChange={(event) => {
            const next = Number(event.target.value) || 5;
            setDurationMinutes(next);
            persistDraft({ durationMinutes: next });
          }}
        />
      </label>

      {loadedCase ? <p className="text-sm text-[var(--olive)]">已填入测试材料。{loadedCase}</p> : null}

      {error ? <p className="notice-error">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "正在分析主线…" : "分析汇报主线"}
        </button>
      </div>
    </form>
  );
}
