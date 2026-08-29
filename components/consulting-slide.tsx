import type { CSSProperties, ReactNode } from "react";
import { parseBlockNumber, statusLabel } from "@/lib/presentation/blocks";
import { barColor, blockTone, pad2, type BlockTone } from "@/lib/presentation/ppt-style";
import { pptCssVars } from "@/lib/presentation/theme";
import type { LayoutId, SlideBlock, SlideSpec } from "@/lib/schemas/deck";

const TONE_CLASS: Record<BlockTone, string> = {
  paper: "bg-[var(--ppt-paper)] text-[var(--ppt-ink)]",
  lime: "bg-[var(--ppt-lime)] text-[var(--ppt-ink)]",
  sage: "bg-[var(--ppt-sage)] text-[var(--ppt-ink)]",
  ink: "bg-[var(--ppt-ink)] text-[var(--ppt-white)]",
};

function toneLabelClass(tone: BlockTone) {
  return tone === "ink" ? "text-[var(--ppt-stone)]" : "text-[var(--ppt-muted)]";
}

function toneDetailClass(tone: BlockTone) {
  return tone === "ink" ? "text-[var(--ppt-stone)]" : "text-[var(--ppt-body)]";
}

function Badge({ status }: { status: SlideBlock["status"] }) {
  const label = statusLabel(status);
  if (!label) {
    return null;
  }
  return (
    <span className="bg-[var(--ppt-ink)] px-1.5 py-0.5 text-[9px] font-medium tracking-[0.08em] text-[var(--ppt-lime)]">
      {label}
    </span>
  );
}

function EvidenceCard({
  block,
  tone,
  tall = false,
}: {
  block: SlideBlock;
  tone: BlockTone;
  tall?: boolean;
}) {
  return (
    <div className={`flex h-full min-h-0 flex-col px-3 py-2.5 ${TONE_CLASS[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] font-medium tracking-[0.12em] uppercase ${toneLabelClass(tone)}`}>
          {block.label}
        </p>
        {statusLabel(block.status) && statusLabel(block.status) !== (block.value || "待补充") ? (
          <Badge status={block.status} />
        ) : null}
      </div>
      <p className={`mt-2 font-semibold leading-snug tracking-tight ${tall ? "text-xl" : "text-sm"}`}>
        {block.value || "待补充"}
      </p>
      {block.detail ? (
        <p className={`mt-1.5 text-[12px] leading-5 ${toneDetailClass(tone)}`}>{block.detail}</p>
      ) : null}
    </div>
  );
}

function HairlineRow({
  block,
  index,
}: {
  block: SlideBlock;
  index: number;
}) {
  return (
    <div className="flex min-h-0 flex-col justify-center border-b border-[var(--ppt-line)] py-2 last:border-b-0">
      <p className="text-[10px] font-medium tracking-[0.14em] text-[var(--ppt-muted)]">
        {pad2(index + 1)}  {block.label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{block.value || "待补充"}</p>
      {block.detail ? <p className="mt-1 text-[12px] leading-5 text-[var(--ppt-body)]">{block.detail}</p> : null}
    </div>
  );
}

function MetricBars({ blocks }: { blocks: SlideBlock[] }) {
  const numeric = blocks
    .map((block) => ({ block, n: parseBlockNumber(block.value) }))
    .filter((item): item is { block: SlideBlock; n: number } => item.n !== null);
  if (numeric.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {blocks.map((block, index) => (
          <HairlineRow key={`${block.label}-${index}`} block={block} index={index} />
        ))}
      </div>
    );
  }
  const max = Math.max(...numeric.map((item) => Math.abs(item.n)), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      {numeric.map((item, index) => (
        <div key={`${item.block.label}-${index}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <p className="text-[11px] tracking-[0.08em] text-[var(--ppt-muted)]">{item.block.label}</p>
            <p className="text-sm font-semibold">{item.block.value}</p>
          </div>
          <div className="h-2.5 w-full bg-[var(--ppt-paper-alt)]">
            <div
              className="h-full"
              style={{
                width: `${Math.max(12, (Math.abs(item.n) / max) * 100)}%`,
                background: `#${barColor(index, numeric.length)}`,
              }}
            />
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
    <div className="grid h-full min-h-0 grid-cols-[0.85fr_1.15fr] gap-0">
      <div className="flex h-full min-h-0 flex-col bg-[var(--ppt-sage)] px-4 py-4">
        {leftBlocks.map((block, index) => (
          <div key={`l-${index}`} className={index > 0 ? "mt-4 border-t border-[var(--ppt-ink)]/15 pt-4" : ""}>
            <p className="text-[10px] font-medium tracking-[0.14em] text-[var(--ppt-ink)]/70">{block.label}</p>
            <p className="mt-2 text-lg font-semibold leading-snug">{block.value || "待补充"}</p>
            {block.detail ? <p className="mt-2 text-[12px] leading-5 text-[var(--ppt-ink)]/80">{block.detail}</p> : null}
          </div>
        ))}
      </div>
      <div className="flex h-full min-h-0 flex-col border-l border-[var(--ppt-line)] pl-5">
        {right.map((block, index) => (
          <HairlineRow key={`r-${index}`} block={block} index={index} />
        ))}
      </div>
    </div>
  );
}

function GridBody({ blocks }: { blocks: SlideBlock[] }) {
  const count = blocks.length;
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  return (
    <div className="grid h-full min-h-0 gap-px bg-[var(--ppt-line)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {blocks.map((block, index) => (
        <EvidenceCard key={`${block.label}-${index}`} block={block} tone={blockTone(block, index)} tall />
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
    <div className="grid h-full min-h-0 grid-cols-[1.25fr_0.85fr] gap-0">
      <div className="pr-5">
        <MetricBars blocks={chartBlocks.length > 0 ? chartBlocks : blocks.slice(0, 3)} />
      </div>
      <EvidenceCard block={insight} tone="ink" tall />
    </div>
  );
}

function ComparisonBody({ blocks }: { blocks: SlideBlock[] }) {
  return (
    <div
      className="grid h-full min-h-0 gap-px bg-[var(--ppt-line)]"
      style={{ gridTemplateColumns: `repeat(${Math.min(blocks.length, 4)}, minmax(0, 1fr))` }}
    >
      {blocks.map((block, index) => (
        <EvidenceCard
          key={`${block.label}-${index}`}
          block={block}
          tone={block.kind === "risk" ? "ink" : index === blocks.length - 1 ? "lime" : index === 0 ? "sage" : "paper"}
          tall
        />
      ))}
    </div>
  );
}

function TimelineBody({ blocks }: { blocks: SlideBlock[] }) {
  const colors = ["var(--ppt-lime)", "var(--ppt-sage)", "var(--ppt-ink)", "var(--ppt-stone)"];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center px-2 pt-1">
        {blocks.map((block, index) => (
          <div key={`n-${block.label}-${index}`} className="flex flex-1 items-center">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
            {index < blocks.length - 1 ? <span className="h-px flex-1 bg-[var(--ppt-line)]" /> : null}
          </div>
        ))}
      </div>
      <div
        className="mt-4 grid min-h-0 flex-1 gap-0"
        style={{ gridTemplateColumns: `repeat(${Math.max(blocks.length, 1)}, minmax(0, 1fr))` }}
      >
        {blocks.map((block, index) => (
          <div key={`${block.label}-${index}`} className="border-l border-[var(--ppt-line)] px-3 first:border-l-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-[var(--ppt-muted)]">{pad2(index + 1)}</p>
            <p className="mt-2 text-[11px] tracking-[0.08em] text-[var(--ppt-muted)]">{block.label}</p>
            <p className="mt-1 text-sm font-semibold leading-snug">{block.value || "待补充"}</p>
            {block.detail ? <p className="mt-1.5 text-[12px] leading-5 text-[var(--ppt-body)]">{block.detail}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionBody({ blocks }: { blocks: SlideBlock[] }) {
  const actions = blocks.filter((block) => block.kind === "action");
  const others = blocks.filter((block) => block.kind !== "action");
  const rows = actions.length > 0 ? actions : blocks;
  return (
    <div className={`grid h-full min-h-0 gap-px bg-[var(--ppt-line)] ${others.length > 0 ? "grid-cols-[1.45fr_0.85fr]" : ""}`}>
      <div className="flex h-full min-h-0 flex-col">
        {rows.map((block, index) => (
          <div key={`a-${index}`} className="flex min-h-0 flex-1 items-start gap-3 border-b border-[var(--ppt-line)] py-2 last:border-b-0">
            <span className="mt-0.5 text-[11px] font-medium tracking-[0.12em] text-[var(--ppt-lime)]">{pad2(index + 1)}</span>
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.08em] text-[var(--ppt-muted)]">{block.label}</p>
              <p className="mt-1 text-sm font-semibold leading-snug">{block.value || "待补充"}</p>
              {block.detail ? <p className="mt-1 text-[12px] leading-5 text-[var(--ppt-body)]">{block.detail}</p> : null}
            </div>
          </div>
        ))}
      </div>
      {others.length > 0 ? (
        <div className="grid h-full min-h-0">
          {others.slice(0, 2).map((block, index) => (
            <EvidenceCard
              key={`o-${index}`}
              block={block}
              tone={block.kind === "risk" ? "ink" : "lime"}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProgressBody({ blocks }: { blocks: SlideBlock[] }) {
  const tones: BlockTone[] = ["lime", "paper", "ink", "sage"];
  return (
    <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-px bg-[var(--ppt-line)]">
      {blocks.slice(0, 4).map((block, index) => (
        <EvidenceCard
          key={`${block.label}-${index}`}
          block={block}
          tone={block.kind === "risk" ? "ink" : block.status === "missing" ? "lime" : tones[index]}
        />
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

export function ConsultingSlide({
  slide,
  layoutId,
  index,
  total,
}: {
  slide: SlideSpec;
  layoutId: LayoutId;
  index: number;
  total: number;
}) {
  const blocks = slide.blocks ?? [];
  const implication = slide.managementImplication || slide.takeaway;
  return (
    <div className="ppt-slide flex h-full min-h-0 flex-col px-8 py-5" style={pptCssVars as CSSProperties}>
      <header>
        <div className="flex items-end justify-between gap-4">
          <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--ppt-muted)]">
            <span className="mr-3 text-[var(--ppt-lime)]">{pad2(index + 1)}</span>
            {slide.eyebrow}
          </p>
          <p className="text-[10px] tracking-[0.16em] text-[var(--ppt-muted)]">
            {pad2(index + 1)} / {pad2(total)}
          </p>
        </div>
        <div className="mt-2 h-px bg-[var(--ppt-line)]" />
        <h2 className="mt-3 text-[1.25rem] font-semibold leading-snug tracking-tight">{slide.headline}</h2>
      </header>
      <div className="mt-4 min-h-0 flex-1 overflow-hidden">{BODIES[layoutId](blocks, implication)}</div>
      {implication ? (
        <footer>
          <div className="mt-3 h-px bg-[var(--ppt-line)]" />
          <p className="mt-2 text-[12px] font-medium leading-5 text-[var(--ppt-ink)]">
            <span className="mr-2 text-[var(--ppt-lime)]">→</span>
            {implication}
          </p>
        </footer>
      ) : null}
    </div>
  );
}
