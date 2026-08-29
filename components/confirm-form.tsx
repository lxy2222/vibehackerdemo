"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { clearConfirmDraft, loadConfirmDraft, saveConfirmDraft } from "@/lib/draft/form-draft";
import {
  INTENT_LABELS,
  REPORT_INTENTS,
  type ReportAnalysis,
  type ReportIntent,
} from "@/lib/schemas/analysis";
import type { ProjectDTO } from "@/lib/projects/types";
import { NotionConnect } from "@/components/notion-connect";
import { VoiceTextarea } from "@/components/voice-textarea";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

function toLines(items: string[]) {
  return items.join("\n");
}

function fromLines(text: string) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function riskLines(analysis: { risks: string[]; missingInformation: string[] }) {
  return toLines([...analysis.risks, ...analysis.missingInformation]);
}

export function ConfirmForm({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const initial = project.analysis;
  const [reportBackground, setReportBackground] = useState(project.leaderRequest);
  const [materials, setMaterials] = useState(project.materials);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [leaderQuestion, setLeaderQuestion] = useState(initial?.leaderQuestion ?? "");
  const [intent, setIntent] = useState<ReportIntent>(initial?.intent ?? "progress");
  const [coreConclusion, setCoreConclusion] = useState(initial?.coreConclusion ?? "");
  const [keyFindings, setKeyFindings] = useState(toLines(initial?.keyFindings ?? []));
  const [risks, setRisks] = useState(
    initial ? riskLines(initial) : "",
  );
  const [nextActions, setNextActions] = useState(toLines(initial?.nextActions ?? []));
  const [decisionAsk, setDecisionAsk] = useState(initial?.decisionAsk ?? "");
  const [error, setError] = useState<string | null>(project.errorMessage);
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();

  useEffect(() => {
    const draft = loadConfirmDraft(project.id);
    if (!draft) {
      return;
    }
    if (draft.reportBackground) {
      setReportBackground(draft.reportBackground);
    }
    if (draft.materials) {
      setMaterials(draft.materials);
    }
  }, [project.id]);

  function persistDraft(next?: { reportBackground?: string; materials?: string }) {
    saveConfirmDraft(project.id, {
      reportBackground: next?.reportBackground ?? reportBackground,
      materials: next?.materials ?? materials,
    });
  }

  function currentAnalysis(): ReportAnalysis {
    return {
      title: title.trim(),
      leaderQuestion: leaderQuestion.trim(),
      intent,
      coreConclusion: coreConclusion.trim(),
      keyFindings: fromLines(keyFindings),
      risks: fromLines(risks),
      nextActions: fromLines(nextActions),
      decisionAsk: decisionAsk.trim() || undefined,
      missingInformation: [],
      excludedDetails: initial?.excludedDetails ?? [],
    };
  }

  function applyProject(next: ProjectDTO) {
    if (!next.analysis) {
      return;
    }
    setReportBackground(next.leaderRequest);
    setMaterials(next.materials);
    setTitle(next.analysis.title);
    setLeaderQuestion(next.analysis.leaderQuestion);
    setIntent(next.analysis.intent);
    setCoreConclusion(next.analysis.coreConclusion);
    setKeyFindings(toLines(next.analysis.keyFindings));
    setRisks(riskLines(next.analysis));
    setNextActions(toLines(next.analysis.nextActions));
    setDecisionAsk(next.analysis.decisionAsk ?? "");
  }

  function reanalyze(nextIntent?: ReportIntent) {
    const selectedIntent = nextIntent ?? intent;
    startAnalyze(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportBackground,
          materials,
          analysis: { ...currentAnalysis(), intent: selectedIntent },
          lockedIntent: nextIntent,
        }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      applyProject((await response.json()) as ProjectDTO);
      clearConfirmDraft(project.id);
      router.refresh();
    });
  }

  function goPreview() {
    startSave(async () => {
      setError(null);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportBackground,
          materials,
          analysis: currentAnalysis(),
        }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      clearConfirmDraft(project.id);
      router.push(`/projects/${project.id}/preview`);
    });
  }

  if (!initial && project.status === "failed") {
    return (
      <div className="panel space-y-4 p-6">
        <p className="text-sm text-[var(--cta)]">{project.errorMessage ?? "分析失败"}</p>
        <a className="btn-secondary" href="/">
          返回创建
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="panel space-y-4 p-7">
        <VoiceTextarea
          label="我最初的汇报背景"
          value={reportBackground}
          onChange={(next) => {
            setReportBackground(next);
            persistDraft({ reportBackground: next });
          }}
          placeholder="写下或口述这次想讲什么、给谁讲、现在卡在哪"
          required
          minClassName="min-h-36"
        />
      </section>

      <section className="panel space-y-4 p-7">
        <h2 className="text-base font-medium">工作对话或材料</h2>
        <NotionConnect
          returnTo={`/projects/${project.id}/outline`}
          onBeforeConnect={() => persistDraft()}
          onImported={(text) => {
            setMaterials((current) => {
              const next = current.trim() ? `${current.trim()}\n\n${text}` : text;
              persistDraft({ materials: next });
              return next;
            });
          }}
        />
        <textarea
          className="field min-h-28"
          value={materials}
          onChange={(event) => {
            setMaterials(event.target.value);
            persistDraft({ materials: event.target.value });
          }}
        />
        <p className="text-base text-[var(--olive)]">可以补一句材料或从 Notion 导入后重新分析。</p>
      </section>
      </div>

      <form className="panel grid gap-6 p-7 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-base font-medium">汇报标题</span>
          <input
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="从材料里总结的主题，例如：跨国家复用交付进展"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">1. 核心管理问题</span>
          <textarea
            className="field min-h-20"
            value={leaderQuestion}
            onChange={(event) => setLeaderQuestion(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">2. 系统判断的汇报目的</span>
          <select
            className="field"
            value={intent}
            disabled={analyzing || saving}
            onChange={(event) => {
              const next = event.target.value as ReportIntent;
              if (next === intent) {
                return;
              }
              setIntent(next);
              reanalyze(next);
            }}
          >
            {REPORT_INTENTS.map((value) => (
              <option key={value} value={value}>
                {INTENT_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="text-base text-[var(--olive)]">
            {analyzing
              ? `正在按「${INTENT_LABELS[intent]}」重写主线…`
              : "换进度汇报或结果汇报后，会按新目的重写问题、结论和发现。"}
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">3. 一句话结论</span>
          <textarea
            className="field min-h-20"
            value={coreConclusion}
            onChange={(event) => setCoreConclusion(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">4. 关键发现</span>
          <textarea
            className="field min-h-28"
            value={keyFindings}
            onChange={(event) => setKeyFindings(event.target.value)}
            placeholder="一行一条"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">5. 风险点</span>
          <textarea
            className="field min-h-24"
            value={risks}
            onChange={(event) => setRisks(event.target.value)}
            placeholder="会上可能被追问的风险点，一行一条"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">6. 下一步行动</span>
          <textarea
            className="field min-h-24"
            value={nextActions}
            onChange={(event) => setNextActions(event.target.value)}
            placeholder="一行一条"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-base font-medium">7. 需要领导拍板的事项</span>
          <textarea
            className="field min-h-20"
            value={decisionAsk}
            onChange={(event) => setDecisionAsk(event.target.value)}
          />
        </label>

      </form>

      {error ? <p className="text-sm text-[var(--cta)]">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-secondary" type="button" disabled={analyzing || saving} onClick={() => reanalyze()}>
          {analyzing ? "正在重新分析…" : "重新分析"}
        </button>
        <button className="btn-primary" type="button" disabled={analyzing || saving} onClick={goPreview}>
          {saving ? "正在生成预览…" : "确认并预览"}
        </button>
      </div>
    </div>
  );
}
