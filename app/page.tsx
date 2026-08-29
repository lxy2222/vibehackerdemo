import { CreateForm } from "@/components/create-form";
import { AppShell } from "@/components/app-shell";
import { WizardNav } from "@/components/wizard-nav";

export default function HomePage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-4">
        <p className="kicker">你的汇报小助手</p>
        <h1 className="font-display text-5xl tracking-tight">汇报不返工</h1>
        <p className="text-lg leading-8 text-[var(--olive)]">
        别让做得好却讲不清，成为升职加薪的绊脚石。
        </p>
      </div>
      <WizardNav current="create" />
      <CreateForm />
    </AppShell>
  );
}
