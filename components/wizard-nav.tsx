const STEPS = [
  { key: "create", label: "创建" },
  { key: "confirm", label: "确认主线" },
  { key: "preview", label: "预览" },
  { key: "export", label: "验收" },
] as const;

export function WizardNav({
  current,
}: {
  current: (typeof STEPS)[number]["key"];
}) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol className="flex flex-wrap gap-3 text-base">
      {STEPS.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li
            key={step.key}
            className={
              active
                ? "rounded-full bg-[linear-gradient(135deg,#ff9ec8,#ff7eb3)] px-4 py-1.5 font-medium text-[#fffdfb] shadow-[0_8px_16px_rgb(255_126_179_/_0.28)]"
                : done
                  ? "rounded-full bg-[var(--mint)]/45 px-4 py-1.5 text-[#3f7468]"
                  : "rounded-full bg-[var(--lilac)] px-4 py-1.5 text-[var(--muted)]"
            }
          >
            {index + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
