import { CreateForm } from "@/components/create-form";
import { WizardNav } from "@/components/wizard-nav";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-[var(--primary)]">模版优先</p>
        <h1 className="text-3xl font-semibold tracking-tight">汇报不返工</h1>
        <p className="text-[15px] leading-7 text-[#3d2a45]/80">
          填汇报原话、领导关注点、漏斗和进度，先出网页幻灯片。不满意写一句意见重生成，需要时再导出
          PPT。
        </p>
      </div>
      <WizardNav current="create" />
      <CreateForm />
    </main>
  );
}
