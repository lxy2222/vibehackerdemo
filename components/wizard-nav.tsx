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
                ? "rounded-full bg-[var(--title)] px-4 py-1.5 font-medium text-[#fcffff]"
                : done
                  ? "rounded-full bg-[var(--cream)] px-4 py-1.5 text-[var(--olive)]"
                  : "rounded-full bg-[var(--lavender)] px-4 py-1.5 text-[var(--muted)]"
            }
          >
            {index + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
