import type { ReactNode } from "react";
import { parseBlockNumber, statusLabel } from "@/lib/presentation/blocks";
import type { LayoutId, SlideBlock, SlideSpec } from "@/lib/schemas/deck";

function Badge({ status }: { status: SlideBlock["status"] }) {
  const label = statusLabel(status);
  if (!label) {
    return null;
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] ${
        status === "missing"
          ? "bg-[var(--error-bg)] text-[var(--error)]"
          : "bg-[var(--lemon)] text-[var(--title)]"
      }`}
    >
      {label}
    </span>
  );
}

function EvidenceCard({
  block,
  dark = false,
  tall = false,
}: {
  block: SlideBlock;
  dark?: boolean;
  tall?: boolean;
}) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col rounded-xl px-3 py-2.5 ${
        dark ? "bg-[#3D3348] text-white" : "bg-white/90 ring-1 ring-[var(--line)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-medium ${dark ? "text-[#E8DEFF]" : "text-[var(--muted)]"}`}>
          {block.label}
        </p>
        {statusLabel(block.status) && statusLabel(block.status) !== (block.value || "待补充") ? (
          <Badge status={block.status} />
        ) : null}
      </div>
      <p className={`mt-1 font-semibold leading-snug ${tall ? "text-lg" : "text-sm"}`}>
        {block.value || "待补充"}
      </p>
      {block.detail ? (
        <p className={`mt-1 text-[12px] leading-5 ${dark ? "text-[#FFE6C7]" : "text-[var(--olive)]"}`}>
          {block.detail}
        </p>
      ) : null}
    </div>
  );
}

function MetricBars({ blocks }: { blocks: SlideBlock[] }) {
  const numeric = blocks
    .map((block) => ({ block, n: parseBlockNumber(block.value) }))
    .filter((item): item is { block: SlideBlock; n: number } => item.n !== null);
  if (numeric.length === 0) {
    return (
      <div className="grid gap-2">
        {blocks.map((block, index) => (
          <EvidenceCard key={`${block.label}-${index}`} block={block} />
        ))}
      </div>
    );
  }
  const max = Math.max(...numeric.map((item) => Math.abs(item.n)), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {numeric.map((item, index) => (
        <div key={`${item.block.label}-${index}`}>
          <p className="text-[11px] text-[var(--muted)]">{item.block.label}</p>
          <div
            className="mt-1 flex h-8 items-center rounded-lg px-2 text-xs font-medium text-white"
            style={{
              width: `${Math.max(18, (Math.abs(item.n) / max) * 100)}%`,
              background: index === numeric.length - 1 ? "var(--accent)" : "var(--primary)",
            }}
          >
            {item.block.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SplitBody({ blocks }: { blocks: SlideBlock[] }) {
  const left = blocks.filter((block) => block.kind === "text").slice(0, 2);
  const leftBlocks = left.length > 0 ? left : blocks.slice(0, 1);
  const right = blocks.filter((block) => !leftBlocks.includes(block)).slice(0, 4);
  return (
    <div className="grid h-full min-h-0 grid-cols-[0.9fr_1.4fr] gap-3">
      <div className="grid gap-2">
        {leftBlocks.map((block, index) => (
          <EvidenceCard key={`l-${index}`} block={block} />
        ))}
      </div>
      <div className="grid gap-2">
        {right.map((block, index) => (
          <EvidenceCard key={`r-${index}`} block={block} />
        ))}
      </div>
    </div>
  );
}

function GridBody({ blocks }: { blocks: SlideBlock[] }) {
  const count = blocks.length;
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  return (
    <div className={`grid h-full min-h-0 gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {blocks.map((block, index) => (
        <EvidenceCard key={`${block.label}-${index}`} block={block} tall />
      ))}
    </div>
  );
}

function ChartBody({ blocks, implication }: { blocks: SlideBlock[]; implication: string }) {
  const chartBlocks = blocks.filter((block) => block.kind === "chart" || block.kind === "metric");
  const insight = blocks.find((block) => block.kind === "text" || block.kind === "risk") ?? {
    kind: "text" as const,
    label: "管理含义",
    value: implication || "见结论",
    detail: "",
    sourceRef: "",
    status: "confirmed" as const,
  };
  return (
    <div className="grid h-full min-h-0 grid-cols-[1.3fr_0.9fr] gap-3">
      <MetricBars blocks={chartBlocks.length > 0 ? chartBlocks : blocks.slice(0, 3)} />
      <EvidenceCard block={insight} dark tall />
    </div>
  );
}

function ComparisonBody({ blocks }: { blocks: SlideBlock[] }) {
  return (
    <div className="grid h-full min-h-0 gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(blocks.length, 4)}, minmax(0, 1fr))` }}>
      {blocks.map((block, index) => (
        <EvidenceCard key={`${block.label}-${index}`} block={block} tall dark={block.kind === "risk"} />
      ))}
    </div>
  );
}

function TimelineBody({ blocks }: { blocks: SlideBlock[] }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col justify-center gap-2 pl-6">
      <div className="absolute bottom-2 left-2 top-2 w-0.5 bg-[var(--lavender)]" />
      {blocks.map((block, index) => (
        <div key={`${block.label}-${index}`} className="relative">
          <span
            className="absolute -left-5 top-4 h-2.5 w-2.5 rounded-full"
            style={{ background: block.kind === "risk" ? "var(--accent)" : "var(--primary)" }}
          />
          <EvidenceCard block={block} />
        </div>
      ))}
    </div>
  );
}

function DecisionBody({ blocks }: { blocks: SlideBlock[] }) {
  const actions = blocks.filter((block) => block.kind === "action");
  const others = blocks.filter((block) => block.kind !== "action");
  const rows = actions.length > 0 ? actions : blocks;
  return (
    <div className={`grid h-full min-h-0 gap-3 ${others.length > 0 ? "grid-cols-[1.4fr_0.8fr]" : ""}`}>
      <div className="grid gap-2">
        {rows.map((block, index) => (
          <EvidenceCard key={`a-${index}`} block={block} />
        ))}
      </div>
      {others.length > 0 ? (
        <div className="grid gap-2">
          {others.slice(0, 2).map((block, index) => (
            <EvidenceCard key={`o-${index}`} block={block} dark={block.kind === "risk"} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProgressBody({ blocks }: { blocks: SlideBlock[] }) {
  return (
    <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2">
      {blocks.slice(0, 4).map((block, index) => (
        <EvidenceCard key={`${block.label}-${index}`} block={block} dark={block.kind === "risk"} />
      ))}
    </div>
  );
}

const BODIES: Record<LayoutId, (blocks: SlideBlock[], implication: string) => ReactNode> = {
  executive_summary_split: (blocks) => <SplitBody blocks={blocks} />,
  metric_grid: (blocks) => <GridBody blocks={blocks} />,
  chart_plus_insight: (blocks, implication) => <ChartBody blocks={blocks} implication={implication} />,
  comparison: (blocks) => <ComparisonBody blocks={blocks} />,
  timeline_risk: (blocks) => <TimelineBody blocks={blocks} />,
  decision_actions: (blocks) => <DecisionBody blocks={blocks} />,
  progress_evidence: (blocks) => <ProgressBody blocks={blocks} />,
};

export function ConsultingSlide({ slide, layoutId }: { slide: SlideSpec; layoutId: LayoutId }) {
  const blocks = slide.blocks ?? [];
  const implication = slide.managementImplication || slide.takeaway;
  return (
    <div className="flex h-full min-h-0 flex-col px-8 py-5">
      {slide.eyebrow ? (
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--primary)]">{slide.eyebrow}</p>
      ) : null}
      <h2 className="mt-1 text-[1.15rem] font-semibold leading-snug">{slide.headline}</h2>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">{BODIES[layoutId](blocks, implication)}</div>
      {implication ? (
        <p className="mt-3 rounded-lg bg-[var(--lavender)] px-3 py-2 text-[13px] font-medium text-[var(--title)]">
          {implication}
        </p>
      ) : null}
    </div>
  );
}
