import { CreateForm } from "@/components/create-form";
import { AppShell } from "@/components/app-shell";
import { WizardNav } from "@/components/wizard-nav";

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-3">
        <p className="kicker">汇报不返工</p>
        <h1 className="text-4xl font-semibold tracking-tight">先把进度讲清楚</h1>
        <p className="max-w-xl text-[15px] leading-7 text-[var(--olive)]">
          填汇报原话、领导关注点和当前进度，先出网页幻灯片。不满意写一句意见重生成，需要时再导出
          PPT。业务漏斗不是必填项。
        </p>
      </div>
      <WizardNav current="create" />
      <CreateForm />
    </AppShell>
  );
}
