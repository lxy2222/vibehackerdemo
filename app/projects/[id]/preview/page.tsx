import { PreviewStudio } from "@/components/preview-studio";
import { AppShell } from "@/components/app-shell";
import { WizardNav } from "@/components/wizard-nav";
import { getProjectDTO } from "@/lib/projects/service";
import { notFound, redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectDTO(id);
  if (!project) {
    notFound();
  }
  if (!project.deck) {
    redirect(`/projects/${id}/outline`);
  }

  return (
    <AppShell wide>
      <div className="max-w-3xl space-y-4">
        <p className="kicker">预览</p>
        <h1 className="font-display text-4xl tracking-tight">{project.deck?.title ?? "汇报模版"}</h1>
        <p className="text-base leading-7 text-[var(--olive)]">
          {project.deck?.subtitle ?? "先预览网页幻灯片，需要时再导出 PPT。"}{" "}
          <a className="underline" href={`/projects/${id}/outline`}>
            返回改主线
          </a>
        </p>
      </div>
      <WizardNav current={project.audit || project.deckId ? "export" : "preview"} />
      <PreviewStudio project={project} />
    </AppShell>
  );
}
