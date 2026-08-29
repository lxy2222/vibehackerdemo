import { CreateForm } from "@/components/create-form";
import { AppShell } from "@/components/app-shell";
import { WizardNav } from "@/components/wizard-nav";

export default function HomePage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-4">
        <p className="kicker">汇报不返工</p>
        <h1 className="text-5xl font-semibold tracking-tight">先把问题讲清楚</h1>
        <p className="text-lg leading-8 text-[var(--olive)]">
          写下或口述最初的汇报背景，再贴一段工作对话。系统先分析领导要判断的问题、风险点和下一步，你改完再出预览。
        </p>
      </div>
      <WizardNav current="create" />
      <CreateForm />
    </AppShell>
  );
}
