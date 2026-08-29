const STEPS = [
  { key: "create", label: "创建" },
  { key: "preview", label: "预览" },
  { key: "export", label: "导出" },
] as const;

export function WizardNav({
  current,
}: {
  current: (typeof STEPS)[number]["key"];
}) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li
            key={step.key}
            className={
              active
                ? "rounded-full bg-[var(--primary)] px-3 py-1 text-white"
                : done
                  ? "rounded-full bg-[#e7f6f3] px-3 py-1 text-[var(--primary)]"
                  : "rounded-full bg-white px-3 py-1 text-[#3d2a45]/50"
            }
          >
            {index + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
