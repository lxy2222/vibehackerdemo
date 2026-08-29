import type { CSSProperties, ReactNode } from "react";
import { ConsultingSlide } from "@/components/consulting-slide";
import { isFunnelStageFact } from "@/lib/facts/from-brief";
import { factMap, formatFactValue, interpolate, resolveFacts } from "@/lib/presentation/facts";
import { pad2 } from "@/lib/presentation/ppt-style";
import { pptCssVars } from "@/lib/presentation/theme";
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
  进行中: "bg-[var(--ppt-sage)] text-[var(--ppt-ink)]",
  有风险: "bg-[var(--ppt-lime)] text-[var(--ppt-ink)]",
  已阻塞: "bg-[var(--ppt-ink)] text-[var(--ppt-white)]",
  已完成: "bg-[var(--ppt-paper-alt)] text-[var(--ppt-muted)]",
};

function CoverSlide({
  slide,
  subtitle,
  index,
  total,
}: {
  slide: SlideSpec;
  subtitle: string;
  index: number;
  total: number;
}) {
  return (
    <div className="ppt-slide ppt-slide-cover flex h-full flex-col px-10 py-8" style={pptCssVars as CSSProperties}>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 bg-[var(--ppt-lime)]" />
        <p className="text-[11px] font-medium tracking-[0.28em] text-[var(--ppt-lime)]">
          {slide.eyebrow || "MANAGEMENT BRIEFING"}
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="max-w-4xl text-[2.45rem] font-semibold leading-[1.12] tracking-tight text-[var(--ppt-white)]">
          {slide.headline}
        </h2>
        <div className="mt-6 h-1 w-16 bg-[var(--ppt-lime)]" />
        <p className="mt-5 max-w-3xl text-lg text-[var(--ppt-sage)]">{slide.takeaway}</p>
        <p className="mt-2 text-sm text-[var(--ppt-stone)]">{subtitle}</p>
      </div>
      <div className="flex items-end justify-between pt-6 text-[11px] tracking-[0.16em] text-[var(--ppt-stone)]">
        <p>{slide.bullets.join("  ·  ")}</p>
        <p>
          {pad2(index + 1)} / {pad2(total)}
        </p>
      </div>
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
        <p className="py-16 text-center text-[var(--ppt-muted)]">还没有漏斗数字</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3 px-2">
          {stages.map((fact, index) => {
            const value = typeof fact.value === "number" ? fact.value : 0;
            const width = 36 + (value / max) * 64;
            return (
              <div
                key={fact.id}
                className="mx-auto flex h-12 items-center justify-center text-sm font-medium"
                style={{
                  width: `${width}%`,
                  background: index === stages.length - 1 ? "var(--ppt-ink)" : index === 0 ? "var(--ppt-lime)" : "var(--ppt-sage)",
                  color: index === stages.length - 1 ? "var(--ppt-white)" : "var(--ppt-ink)",
                }}
              >
                {fact.label} {formatFactValue(fact)}
              </div>
            );
          })}
          {slide.bullets.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[13px] text-[var(--ppt-body)]">
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
        <p className="py-16 text-center text-[var(--ppt-muted)]">还没有进度事项</p>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[var(--ppt-muted)]">
              <th className="pb-2 font-medium tracking-[0.12em]">事项</th>
              <th className="pb-2 font-medium tracking-[0.12em]">状态</th>
              <th className="pb-2 font-medium tracking-[0.12em]">负责人</th>
              <th className="pb-2 font-medium tracking-[0.12em]">说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--ppt-line)]">
                <td className="py-2 pr-3 font-medium">{row.name}</td>
                <td className="py-2 pr-3">
                  <span className={`px-2 py-0.5 text-xs ${STATUS_TONE[row.status] ?? "bg-[var(--ppt-paper-alt)]"}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2 pr-3">{row.owner}</td>
                <td className="py-2 text-[var(--ppt-body)]">{row.note}</td>
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
            ? "space-y-1 text-[13px] leading-5 text-[var(--ppt-ink)]"
            : "space-y-1.5 text-[14px] leading-5 text-[var(--ppt-ink)]"
        }
      >
        {slide.bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--ppt-lime)]" />
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
          <tr className="bg-[var(--ppt-ink)] text-[var(--ppt-white)]">
            <th className="px-3 py-2 font-medium tracking-[0.08em]">行动</th>
            <th className="px-3 py-2 font-medium tracking-[0.08em]">负责人</th>
            <th className="px-3 py-2 font-medium tracking-[0.08em]">截止</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--ppt-line)]">
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
    <div
      className={`ppt-slide flex h-full flex-col px-8 ${compact ? "py-5" : "py-6"}`}
      style={pptCssVars as CSSProperties}
    >
      <div className="h-px bg-[var(--ppt-line)]" />
      <h2 className="mt-3 text-xl font-semibold tracking-tight">{interpolate(slide.headline, facts)}</h2>
      {slide.takeaway ? (
        <p className={`font-medium text-[var(--ppt-ink)] ${compact ? "mt-2 text-[13px]" : "mt-3 text-sm"}`}>
          <span className="mr-2 text-[var(--ppt-lime)]">→</span>
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
    body = <CoverSlide slide={slide} subtitle={subtitle} index={index} total={total} />;
  } else if (layoutId) {
    body = <ConsultingSlide slide={slide} layoutId={layoutId} index={index} total={total} />;
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
      <div className="slide-frame">{body}</div>
    </article>
  );
}
