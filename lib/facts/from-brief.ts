import type { Brief } from "@/lib/schemas/brief";
import { STATUS_LABELS } from "@/lib/schemas/brief";
import type { Fact } from "@/lib/presentation/types";

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function isFunnelStageFact(fact: Fact) {
  return Boolean(fact.dimensions.stage) && /^fact_funnel_\d+$/.test(fact.id);
}

export function factsFromBrief(brief: Brief): Fact[] {
  const facts: Fact[] = [];

  brief.funnel.forEach((stage, index) => {
    facts.push({
      id: `fact_funnel_${index + 1}`,
      sourceId: "form",
      label: stage.name,
      value: stage.value,
      unit: null,
      period: null,
      dimensions: { stage: stage.name },
      locator: {},
    });

    if (index === 0) {
      return;
    }

    const prev = brief.funnel[index - 1];
    const rate = prev.value > 0 ? (stage.value / prev.value) * 100 : 0;
    facts.push({
      id: `fact_funnel_conv_${index + 1}`,
      sourceId: "form",
      label: `${prev.name}→${stage.name}转化`,
      value: round1(rate),
      unit: "%",
      period: null,
      dimensions: {},
      locator: {},
      calculation: `${stage.value} / ${prev.value}`,
    });
  });

  if (brief.funnel.length >= 2) {
    const first = brief.funnel[0];
    const last = brief.funnel[brief.funnel.length - 1];
    const overall = first.value > 0 ? (last.value / first.value) * 100 : 0;
    facts.push({
      id: "fact_funnel_overall_conv",
      sourceId: "form",
      label: `${first.name}→${last.name}总转化`,
      value: round1(overall),
      unit: "%",
      period: null,
      dimensions: {},
      locator: {},
      calculation: `${last.value} / ${first.value}`,
    });
  }

  const counts: Record<string, number> = {
    on_track: 0,
    at_risk: 0,
    blocked: 0,
    done: 0,
  };
  brief.progress.forEach((item, index) => {
    counts[item.status] += 1;
    facts.push({
      id: `fact_progress_item_${index + 1}`,
      sourceId: "form",
      label: item.name,
      value: STATUS_LABELS[item.status],
      unit: null,
      period: null,
      dimensions: {
        status: item.status,
        owner: item.owner || "待定",
      },
      locator: {},
    });
  });

  (Object.keys(counts) as Array<keyof typeof counts>).forEach((status) => {
    facts.push({
      id: `fact_progress_${status}`,
      sourceId: "form",
      label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
      value: counts[status],
      unit: "项",
      period: null,
      dimensions: { status },
      locator: {},
    });
  });

  facts.push({
    id: "fact_progress_total",
    sourceId: "form",
    label: "事项总数",
    value: brief.progress.length,
    unit: "项",
    period: null,
    dimensions: {},
    locator: {},
  });

  return facts;
}
