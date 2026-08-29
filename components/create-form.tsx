"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FOCUS_LABELS,
  LEADER_FOCUSES,
  STATUS_LABELS,
  PROGRESS_STATUSES,
  defaultFunnelStages,
  defaultProgressItems,
  type LeaderFocus,
  type ProgressStatus,
} from "@/lib/schemas/brief";

type FunnelRow = { id: string; name: string; value: string };
type ProgressRow = {
  id: string;
  name: string;
  status: ProgressStatus;
  owner: string;
  note: string;
};

function newId() {
  return crypto.randomUUID();
}

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `请求失败 (${response.status})`;
}

export function CreateForm() {
  const router = useRouter();
  const [leaderRequest, setLeaderRequest] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [focuses, setFocuses] = useState<LeaderFocus[]>(["progress"]);
  const [funnel, setFunnel] = useState<FunnelRow[]>(() =>
    defaultFunnelStages().map((stage) => ({ ...stage, value: "" })),
  );
  const [progress, setProgress] = useState<ProgressRow[]>(() =>
    defaultProgressItems().map((item) => ({ ...item })),
  );
  const [useDemo, setUseDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleFocus(focus: LeaderFocus) {
    setUseDemo(false);
    setFocuses((current) => {
      if (current.includes(focus)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== focus);
      }
      return [...current, focus];
    });
  }

  async function loadDemo() {
    setError(null);
    const response = await fetch("/api/demo-fixtures");
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    const data = (await response.json()) as {
      leaderRequest: string;
      durationMinutes: number;
      brief: {
        focuses: LeaderFocus[];
        funnel: { id: string; name: string; value: number }[];
        progress: ProgressRow[];
      };
    };
    setLeaderRequest(data.leaderRequest);
    setDurationMinutes(data.durationMinutes);
    setFocuses(data.brief.focuses);
    setFunnel(data.brief.funnel.map((stage) => ({ ...stage, value: String(stage.value) })));
    setProgress(data.brief.progress);
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
            leaderRequest,
            durationMinutes,
            useDemo,
            brief: {
              focuses,
              funnel: funnel.map((stage) => ({
                id: stage.id,
                name: stage.name,
                value: Number(stage.value),
              })),
              progress: progress.map((item) => ({
                id: item.id,
                name: item.name,
                status: item.status,
                owner: item.owner,
                note: item.note,
              })),
            },
          }),
        });
        if (!response.ok) {
          setError(await readError(response));
          return;
        }
        const project = (await response.json()) as { id: string };
        router.push(`/projects/${project.id}/preview`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "生成失败");
      }
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium">汇报原话</span>
        <textarea
          className="field min-h-32"
          value={leaderRequest}
          onChange={(event) => {
            setLeaderRequest(event.target.value);
            setUseDemo(false);
          }}
          placeholder="粘贴领导原话，例如周五给管理层十分钟，重点看漏斗和进度"
          required
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">面向领导的关注点</legend>
        <div className="flex flex-wrap gap-2">
          {LEADER_FOCUSES.map((focus) => {
            const on = focuses.includes(focus);
            return (
              <button
                key={focus}
                type="button"
                className={on ? "chip chip-on" : "chip"}
                onClick={() => toggleFocus(focus)}
              >
                {FOCUS_LABELS[focus]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">业务漏斗</h2>
          <button
            className="text-sm text-[var(--primary)]"
            type="button"
            onClick={() => {
              setUseDemo(false);
              setFunnel((rows) => [...rows, { id: newId(), name: "", value: "" }]);
            }}
          >
            加阶段
          </button>
        </div>
        <div className="space-y-2">
          {funnel.map((stage, index) => (
            <div key={stage.id} className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <input
                className="field"
                value={stage.name}
                placeholder={`阶段 ${index + 1}`}
                required
                onChange={(event) => {
                  setUseDemo(false);
                  setFunnel((rows) =>
                    rows.map((row) =>
                      row.id === stage.id ? { ...row, name: event.target.value } : row,
                    ),
                  );
                }}
              />
              <input
                className="field"
                inputMode="numeric"
                value={stage.value}
                placeholder="数量"
                required
                onChange={(event) => {
                  setUseDemo(false);
                  setFunnel((rows) =>
                    rows.map((row) =>
                      row.id === stage.id ? { ...row, value: event.target.value } : row,
                    ),
                  );
                }}
              />
              <button
                className="btn-secondary px-3"
                type="button"
                disabled={funnel.length <= 2}
                onClick={() => {
                  setUseDemo(false);
                  setFunnel((rows) => rows.filter((row) => row.id !== stage.id));
                }}
              >
                删
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">项目进度</h2>
          <button
            className="text-sm text-[var(--primary)]"
            type="button"
            onClick={() => {
              setUseDemo(false);
              setProgress((rows) => [
                ...rows,
                { id: newId(), name: "", status: "on_track", owner: "", note: "" },
              ]);
            }}
          >
            加事项
          </button>
        </div>
        <div className="space-y-3">
          {progress.map((item) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                <input
                  className="field"
                  value={item.name}
                  placeholder="事项名称"
                  required
                  onChange={(event) => {
                    setUseDemo(false);
                    setProgress((rows) =>
                      rows.map((row) =>
                        row.id === item.id ? { ...row, name: event.target.value } : row,
                      ),
                    );
                  }}
                />
                <select
                  className="field"
                  value={item.status}
                  onChange={(event) => {
                    setUseDemo(false);
                    setProgress((rows) =>
                      rows.map((row) =>
                        row.id === item.id
                          ? { ...row, status: event.target.value as ProgressStatus }
                          : row,
                      ),
                    );
                  }}
                >
                  {PROGRESS_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary px-3"
                  type="button"
                  disabled={progress.length <= 1}
                  onClick={() => {
                    setUseDemo(false);
                    setProgress((rows) => rows.filter((row) => row.id !== item.id));
                  }}
                >
                  删
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="field"
                  value={item.owner}
                  placeholder="负责人（可选）"
                  onChange={(event) => {
                    setUseDemo(false);
                    setProgress((rows) =>
                      rows.map((row) =>
                        row.id === item.id ? { ...row, owner: event.target.value } : row,
                      ),
                    );
                  }}
                />
                <input
                  className="field"
                  value={item.note}
                  placeholder="一句说明（可选）"
                  onChange={(event) => {
                    setUseDemo(false);
                    setProgress((rows) =>
                      rows.map((row) =>
                        row.id === item.id ? { ...row, note: event.target.value } : row,
                      ),
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

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
        <p className="text-sm text-[var(--primary)]">已填入 demo 原话、漏斗和进度。</p>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "正在生成模版…" : "生成汇报模版"}
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
