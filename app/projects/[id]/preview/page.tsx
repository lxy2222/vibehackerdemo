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
  if (!project.deck && project.status === "draft") {
    redirect("/");
  }

  return (
    <AppShell wide>
      <div className="space-y-3">
        <p className="kicker">预览</p>
        <h1 className="text-3xl font-semibold tracking-tight">{project.deck?.title ?? "汇报模版"}</h1>
        <p className="text-sm leading-6 text-[var(--olive)]">
          {project.deck?.subtitle ?? "先预览网页幻灯片，需要时再导出 PPT。"}
        </p>
      </div>
      <WizardNav current={project.deckId ? "export" : "preview"} />
      <PreviewStudio project={project} />
    </AppShell>
  );
}
