import type { ReactNode } from "react";
import { ConsultingSlide } from "@/components/consulting-slide";
import { isFunnelStageFact } from "@/lib/facts/from-brief";
import { factMap, formatFactValue, interpolate, resolveFacts } from "@/lib/presentation/facts";
import type { Fact, SlideSpec } from "@/lib/presentation/types";
import { isConsultingLayout, LAYOUT_LABELS } from "@/lib/schemas/deck";

const TYPE_LABEL: Record<string, string> = {
  cover: "封面",
  executive_summary: "核心结论",
  funnel: "业务漏斗",
  progress: "当前进度",
  tech_focus: "技术实现",
  diagnosis: "风险点",
  recommendations: "建议",
  action_plan: "行动计划",
  kpi_overview: "指标总览",
  trend: "趋势",
  executive_summary_split: LAYOUT_LABELS.executive_summary_split,
  metric_grid: LAYOUT_LABELS.metric_grid,
  chart_plus_insight: LAYOUT_LABELS.chart_plus_insight,
  comparison: LAYOUT_LABELS.comparison,
  timeline_risk: LAYOUT_LABELS.timeline_risk,
  decision_actions: LAYOUT_LABELS.decision_actions,
  progress_evidence: LAYOUT_LABELS.progress_evidence,
};

const STATUS_TONE: Record<string, string> = {
  进行中: "bg-[var(--lavender)] text-[var(--title)]",
  有风险: "bg-[var(--cream)] text-[var(--olive)]",
  已阻塞: "bg-[var(--error-bg)] text-[var(--error)]",
  已完成: "bg-[#f3f3f5] text-[var(--muted)]",
};

function CoverSlide({ slide, subtitle }: { slide: SlideSpec; subtitle: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-12 py-10 text-center">
      <p className="text-sm font-medium tracking-wide text-[var(--primary)]">工作汇报</p>
      <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight">{slide.headline}</h2>
      <p className="mt-4 max-w-3xl text-xl text-[var(--accent)]">{slide.takeaway}</p>
      <p className="mt-3 text-base text-[var(--olive)]">{subtitle}</p>
      {slide.bullets.length > 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">{slide.bullets.join("  ·  ")}</p>
      ) : null}
    </div>
  );
}

function FunnelSlide({
  slide,
  facts,
}: {
  slide: SlideSpec;
  facts: Map<string, Fact>;
}) {
  const stages = resolveFacts(slide.chart?.factRefs ?? slide.factRefs, facts).filter(isFunnelStageFact);
  const max = Math.max(...stages.map((fact) => (typeof fact.value === "number" ? fact.value : 0)), 1);

  return (
    <ContentFrame slide={slide} facts={facts}>
      {stages.length === 0 ? (
        <p className="py-16 text-center text-[var(--muted)]">还没有漏斗数字</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3 px-2">
          {stages.map((fact, index) => {
            const value = typeof fact.value === "number" ? fact.value : 0;
            const width = 36 + (value / max) * 64;
            return (
              <div
                key={fact.id}
                className="mx-auto flex h-12 items-center justify-center rounded-lg text-sm font-medium text-white"
                style={{
                  width: `${width}%`,
                  background: index === stages.length - 1 ? "var(--accent)" : "var(--primary)",
                }}
              >
                {fact.label} {formatFactValue(fact)}
              </div>
            );
          })}
          {slide.bullets.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[13px] text-[var(--olive)]">
              {slide.bullets.map((bullet, index) => (
                <li key={index}>{interpolate(bullet, facts)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </ContentFrame>
  );
}

function ProgressSlide({
  slide,
  facts,
}: {
  slide: SlideSpec;
  facts: Map<string, Fact>;
}) {
  const rows = slide.bullets.map((bullet) => {
    const [name, status, owner, note] = interpolate(bullet, facts)
      .split("｜")
      .map((part) => part.trim());
    return { name: name || bullet, status: status || "进行中", owner: owner || "待定", note: note || "" };
  });

  return (
    <ContentFrame slide={slide} facts={facts}>
      {rows.length === 0 ? (
        <p className="py-16 text-center text-[var(--muted)]">还没有进度事项</p>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[var(--primary)]">
              <th className="pb-2 font-medium">事项</th>
              <th className="pb-2 font-medium">状态</th>
              <th className="pb-2 font-medium">负责人</th>
              <th className="pb-2 font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--line)]">
                <td className="py-2 pr-3 font-medium">{row.name}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[row.status] ?? "bg-[#eef2f3]"}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2 pr-3">{row.owner}</td>
                <td className="py-2 text-[var(--olive)]">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ContentFrame>
  );
}

function BulletSlide({
  slide,
  facts,
}: {
  slide: SlideSpec;
  facts: Map<string, Fact>;
}) {
  const dense = slide.bullets.length > 6;
  return (
    <ContentFrame slide={slide} facts={facts} compact>
      <ul
        className={
          dense
            ? "space-y-1 text-[13px] leading-5 text-[var(--title)]"
            : "space-y-1.5 text-[14px] leading-5 text-[var(--title)]"
        }
      >
        {slide.bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
            <span>{interpolate(bullet, facts)}</span>
          </li>
        ))}
      </ul>
    </ContentFrame>
  );
}

function ActionSlide({
  slide,
  facts,
}: {
  slide: SlideSpec;
  facts: Map<string, Fact>;
}) {
  const rows = slide.bullets.map((bullet) => {
    const [action, owner, due] = interpolate(bullet, facts)
      .split("｜")
      .map((part) => part.trim());
    return { action: action || bullet, owner: owner || "待定", due: due || "待定" };
  });

  return (
    <ContentFrame slide={slide} facts={facts}>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="bg-[var(--primary)] text-white">
            <th className="px-3 py-2 font-medium">行动</th>
            <th className="px-3 py-2 font-medium">负责人</th>
            <th className="px-3 py-2 font-medium">截止</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--line)]">
              <td className="px-3 py-2">{row.action}</td>
              <td className="px-3 py-2">{row.owner}</td>
              <td className="px-3 py-2">{row.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContentFrame>
  );
}

function ContentFrame({
  slide,
  facts,
  children,
  compact = false,
}: {
  slide: SlideSpec;
  facts: Map<string, Fact>;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex h-full flex-col px-8 ${compact ? "py-5" : "py-6"}`}>
      <h2 className="text-xl font-semibold">{interpolate(slide.headline, facts)}</h2>
      {slide.takeaway ? (
        <p
          className={`rounded-lg bg-[var(--lavender)] px-3 font-medium text-[var(--title)] ${
            compact ? "mt-2 py-1.5 text-[13px]" : "mt-3 py-2 text-sm"
          }`}
        >
          {interpolate(slide.takeaway, facts)}
        </p>
      ) : null}
      <div className={`min-h-0 flex-1 overflow-hidden ${compact ? "mt-2" : "mt-4"}`}>{children}</div>
    </div>
  );
}

export function SlidePreview({
  slide,
  subtitle,
  facts,
  index,
  total,
}: {
  slide: SlideSpec;
  subtitle: string;
  facts: Fact[];
  index: number;
  total: number;
}) {
  const map = factMap(facts);
  const layoutId = slide.layoutId ?? (isConsultingLayout(slide.type) && (slide.blocks?.length ?? 0) > 0 ? slide.type : null);
  let body: ReactNode;
  if (slide.type === "cover") {
    body = <CoverSlide slide={slide} subtitle={subtitle} />;
  } else if (layoutId) {
    body = <ConsultingSlide slide={slide} layoutId={layoutId} />;
  } else if (slide.type === "funnel") {
    body = <FunnelSlide slide={slide} facts={map} />;
  } else if (slide.type === "progress") {
    body = <ProgressSlide slide={slide} facts={map} />;
  } else if (slide.type === "action_plan") {
    body = <ActionSlide slide={slide} facts={map} />;
  } else {
    body = <BulletSlide slide={slide} facts={map} />;
  }

  return (
    <article className="space-y-2">
      <p className="text-xs text-[var(--muted)]">
        {index + 1}/{total} · {TYPE_LABEL[slide.type] ?? slide.type}
      </p>
      <div className="slide-frame">
        <div className="slide-accent" />
        {body}
      </div>
    </article>
  );
}
