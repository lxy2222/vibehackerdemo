import { ConfirmForm } from "@/components/confirm-form";
import { AppShell } from "@/components/app-shell";
import { WizardNav } from "@/components/wizard-nav";
import { getProjectDTO } from "@/lib/projects/service";
import { notFound, redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function OutlinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectDTO(id);
  if (!project) {
    notFound();
  }
  if (!project.analysis && project.status === "draft") {
    redirect("/");
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-4">
        <p className="kicker">确认汇报主线</p>
        <h1 className="font-display text-4xl tracking-tight">先看领导要判断什么</h1>
        <p className="text-base leading-7 text-[var(--olive)]">
          先看分析出的主线。要改一句话汇报或材料，点「修改一句话汇报」。
        </p>
      </div>
      <WizardNav current="confirm" />
      <ConfirmForm project={project} />
    </AppShell>
  );
}
