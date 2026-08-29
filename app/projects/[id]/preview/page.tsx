import { PreviewStudio } from "@/components/preview-studio";
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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{project.deck?.title ?? "汇报模版"}</h1>
        <p className="text-sm leading-6 text-[#3d2a45]/75">
          {project.deck?.subtitle ?? "先预览网页幻灯片，需要时再导出 PPT。"}
        </p>
      </div>
      <WizardNav current={project.deckId ? "export" : "preview"} />
      <PreviewStudio project={project} />
    </main>
  );
}
