"use client";

import { AppShell } from "@/components/app-shell";
import { PreviewStudio } from "@/components/preview-studio";
import { ProjectGate } from "@/components/project-gate";
import { WizardNav } from "@/components/wizard-nav";

export function PreviewView({ id }: { id: string }) {
  return (
    <ProjectGate id={id}>
      {(project, setProject) => {
        if (!project.deck) {
          return (
            <AppShell>
              <p className="notice-error">还没有预览稿，请先确认主线。</p>
              <a className="btn-secondary" href={`/projects/${id}/outline`}>
                返回确认主线
              </a>
            </AppShell>
          );
        }

        return (
          <AppShell wide>
            <div className="max-w-3xl space-y-4">
              <p className="kicker">预览</p>
              <h1 className="font-display text-4xl tracking-tight">{project.deck.title ?? "汇报模版"}</h1>
              <p className="text-base leading-7 text-[var(--olive)]">
                {project.deck.subtitle ?? "先预览网页幻灯片，需要时再导出 PPT。"}{" "}
                <a className="underline" href={`/projects/${id}/outline`}>
                  返回改主线
                </a>
              </p>
            </div>
            <WizardNav current={project.audit || project.deckId ? "export" : "preview"} />
            <PreviewStudio project={project} onProjectChange={setProject} />
          </AppShell>
        );
      }}
    </ProjectGate>
  );
}
