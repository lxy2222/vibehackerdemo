"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NotionConnect } from "@/components/notion-connect";
import { VoiceTextarea } from "@/components/voice-textarea";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function CreateForm() {
  const router = useRouter();
  const [reportBackground, setReportBackground] = useState("");
  const [materials, setMaterials] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [useDemo, setUseDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function loadDemo() {
    setError(null);
    const response = await fetch("/api/demo-fixtures");
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    const data = (await response.json()) as {
      reportBackground: string;
      materials: string;
      durationMinutes: number;
    };
    setReportBackground(data.reportBackground);
    setMaterials(data.materials);
    setDurationMinutes(data.durationMinutes);
    setUseDemo(true);
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
            useDemo,
          }),
        });
        if (!response.ok) {
          setError(await readError(response));
          return;
        }
        const project = (await response.json()) as { id: string };
        router.push(`/projects/${project.id}/outline`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分析失败");
      }
    });
  }

  return (
    <form
      className="panel space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <VoiceTextarea
        label="我最初的汇报背景"
        value={reportBackground}
        onChange={(next) => {
          setReportBackground(next);
          setUseDemo(false);
        }}
        placeholder="写下或口述这次想讲什么、给谁讲、现在卡在哪，例如周五给管理层十分钟，重点讲复用后的交付效率"
        required
      />

      <div className="space-y-3">
        <span className="text-sm font-medium">工作对话或材料</span>
        <NotionConnect
          returnTo="/"
          onImported={(text) => {
            setMaterials((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
            setUseDemo(false);
          }}
        />
        <textarea
          className="field min-h-40"
          value={materials}
          onChange={(event) => {
            setMaterials(event.target.value);
            setUseDemo(false);
          }}
          placeholder="粘贴一段工作沟通、会议记录，或先连接 Notion 导入页面。"
        />
      </div>

      <label className="block space-y-2 text-sm">
        <span className="font-medium">汇报时长（分钟，可选）</span>
        <input
          className="field max-w-40"
          type="number"
          min={1}
          max={90}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value) || 10)}
        />
      </label>

      {useDemo ? (
        <p className="text-sm text-[var(--olive)]">已填入 demo 汇报背景和工作对话。</p>
      ) : null}

      {error ? <p className="text-sm text-[var(--cta)]">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "正在分析主线…" : "分析汇报主线"}
        </button>
        <button
          className="btn-secondary"
          type="button"
          disabled={pending}
          onClick={() => {
            void loadDemo();
          }}
        >
          使用 demo 材料
        </button>
      </div>
    </form>
  );
}
