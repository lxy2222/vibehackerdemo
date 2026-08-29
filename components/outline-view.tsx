"use client";

import { AppShell } from "@/components/app-shell";
import { ConfirmForm } from "@/components/confirm-form";
import { ProjectGate } from "@/components/project-gate";
import { WizardNav } from "@/components/wizard-nav";

export function OutlineView({ id }: { id: string }) {
  return (
    <ProjectGate id={id}>
      {(project, setProject) => {
        if (!project.analysis && project.status === "draft") {
          return (
            <AppShell>
              <p className="notice-error">还没有分析主线，请从首页重新创建。</p>
              <a className="btn-secondary" href="/">
                返回创建
              </a>
            </AppShell>
          );
        }

        return (
          <AppShell>
            <div className="max-w-3xl space-y-4">
              <p className="kicker">确认汇报主线</p>
              <h1 className="font-display text-4xl tracking-tight">先看领导要判断什么</h1>
              <p className="text-base leading-7 text-[var(--olive)]">
                先看分析出的主线。要改一句话汇报或材料，点「修改一句话汇报」。草稿只保存在当前浏览器。
              </p>
            </div>
            <WizardNav current="confirm" />
            <ConfirmForm project={project} onProjectChange={setProject} />
          </AppShell>
        );
      }}
    </ProjectGate>
  );
}
