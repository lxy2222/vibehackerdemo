import type { Fact } from "@/lib/presentation/types";
import type { ParsedTable } from "@/lib/parsers/table";
import type { ColumnMapping } from "@/lib/schemas/requirement";

const METRIC_SLUGS: Record<string, string> = {
  revenue: "revenue",
  收入: "revenue",
  营收: "revenue",
  cost: "cost",
  成本: "cost",
  投放成本: "cost",
  费用: "cost",
  visits: "visits",
  访问: "visits",
  uv: "visits",
  orders: "orders",
  订单: "orders",
  成交: "orders",
  impressions: "impressions",
  曝光: "impressions",
  clicks: "clicks",
  点击: "clicks",
  unsubscribes: "unsubscribes",
  退订: "unsubscribes",
  退订数: "unsubscribes",
};

const METRIC_LABELS: Record<string, string> = {
  revenue: "收入",
  cost: "投放成本",
  visits: "访问",
  orders: "订单",
  impressions: "曝光",
  clicks: "点击",
  unsubscribes: "退订",
  conversion: "转化率",
  share: "占比",
  cpa: "获客成本",
};

const DIM_SLUGS: Record<string, string> = {
  信息流: "feed",
  品牌广告: "brand",
  私域: "private",
  内容种草: "content",
};

function slugToken(raw: string): string {
  const known = METRIC_SLUGS[raw] ?? DIM_SLUGS[raw];
  if (known) {
    return known;
  }
  const ascii = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (ascii) {
    return ascii.slice(0, 24);
  }
  let hash = 0;
  for (const char of raw) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `d${hash.toString(36)}`;
}

function periodSlug(period: string): string {
  return period.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function periodLabel(period: string): string {
  const match = period.match(/Q([1-4])/i);
  return match ? `Q${match[1]}` : period;
}

function toNumber(value: string | number | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function metricUnit(slug: string): string | null {
  if (slug === "revenue" || slug === "cost" || slug === "cpa") {
    return "元";
  }
  if (slug === "conversion" || slug === "share") {
    return "%";
  }
  return null;
}

export function computeFacts(
  table: ParsedTable,
  mapping: ColumnMapping,
  sourceId: string,
): Fact[] {
  if (mapping.metrics.length === 0 || table.rows.length === 0) {
    return [];
  }

  const facts: Fact[] = [];
  const push = (fact: Fact) => {
    facts.push(fact);
  };

  const periodCol = mapping.period;
  const dimCol = mapping.dimensions[0] ?? null;
  const periods = periodCol
    ? uniqueSorted(
        table.rows
          .map((row) => (row[periodCol] == null ? "" : String(row[periodCol])))
          .filter(Boolean),
      )
    : ["全部"];

  const latest = periods.at(-1) ?? "全部";
  const previous = periods.length > 1 ? periods.at(-2) : null;

  const rowsFor = (period: string, dimValue?: string) =>
    table.rows.filter((row) => {
      const periodMatch = !periodCol || String(row[periodCol] ?? "") === period;
      const dimMatch =
        !dimCol || dimValue === undefined || String(row[dimCol] ?? "") === dimValue;
      return periodMatch && dimMatch;
    });

  const sumMetric = (period: string, metric: string, dimValue?: string) => {
    return rowsFor(period, dimValue).reduce((acc, row) => acc + (toNumber(row[metric]) ?? 0), 0);
  };

  for (const metric of mapping.metrics) {
    const slug = slugToken(metric);
    const label = METRIC_LABELS[slug] ?? metric;
    const unit = metricUnit(slug);

    for (const period of periods) {
      const value = sumMetric(period, metric);
      push({
        id: `fact_${slug}_${periodSlug(period)}`,
        sourceId,
        label: `${periodLabel(period)} ${label}`,
        value,
        unit,
        period,
        dimensions: {},
        locator: { sheet: table.sheet },
        calculation: `sum(${metric} where period=${period})`,
      });

      if (dimCol) {
        const dimValues = uniqueSorted(
          rowsFor(period)
            .map((row) => String(row[dimCol] ?? ""))
            .filter(Boolean),
        );
        for (const dimValue of dimValues) {
          push({
            id: `fact_${slug}_${slugToken(dimValue)}_${periodSlug(period)}`,
            sourceId,
            label: `${dimCol}${label}`,
            value: sumMetric(period, metric, dimValue),
            unit,
            period,
            dimensions: { [dimCol === "渠道" ? "channel" : dimCol]: dimValue },
            locator: { sheet: table.sheet },
            calculation: `sum(${metric} where ${dimCol}=${dimValue} and period=${period})`,
          });
        }
      }
    }

    if (previous) {
      const currentValue = sumMetric(latest, metric);
      const previousValue = sumMetric(previous, metric);
      if (previousValue !== 0) {
        const growth = round1(((currentValue - previousValue) / previousValue) * 100);
        push({
          id: `fact_${slug}_growth`,
          sourceId,
          label: `${label}环比`,
          value: growth,
          unit: "%",
          period: latest,
          dimensions: {},
          locator: { sheet: table.sheet },
          calculation: `(${latest}-${previous})/${previous}`,
        });
      }
    }
  }

  const ordersCol = mapping.metrics.find((col) => slugToken(col) === "orders");
  const visitsCol = mapping.metrics.find((col) => slugToken(col) === "visits");
  if (ordersCol && visitsCol) {
    for (const period of periods) {
      const orders = sumMetric(period, ordersCol);
      const visits = sumMetric(period, visitsCol);
      if (visits > 0) {
        push({
          id: `fact_conversion_${periodSlug(period)}`,
          sourceId,
          label: `${periodLabel(period)} 转化率`,
          value: round1((orders / visits) * 100),
          unit: "%",
          period,
          dimensions: {},
          locator: { sheet: table.sheet },
          calculation: "orders/visits",
        });
      }

      if (dimCol) {
        const dimValues = uniqueSorted(
          rowsFor(period)
            .map((row) => String(row[dimCol] ?? ""))
            .filter(Boolean),
        );
        for (const dimValue of dimValues) {
          const dimOrders = sumMetric(period, ordersCol, dimValue);
          const dimVisits = sumMetric(period, visitsCol, dimValue);
          if (dimVisits > 0) {
            push({
              id: `fact_conversion_${slugToken(dimValue)}_${periodSlug(period)}`,
              sourceId,
              label: "渠道转化率",
              value: round1((dimOrders / dimVisits) * 100),
              unit: "%",
              period,
              dimensions: { channel: dimValue },
              locator: { sheet: table.sheet },
              calculation: "orders/visits",
            });
          }
        }
      }
    }

    if (previous) {
      const currentVisits = sumMetric(latest, visitsCol);
      const previousVisits = sumMetric(previous, visitsCol);
      const current = currentVisits > 0 ? sumMetric(latest, ordersCol) / currentVisits : 0;
      const prev = previousVisits > 0 ? sumMetric(previous, ordersCol) / previousVisits : 0;
      if (prev !== 0) {
        push({
          id: "fact_conversion_growth",
          sourceId,
          label: "转化率环比",
          value: round1(((current - prev) / prev) * 100),
          unit: "%",
          period: latest,
          dimensions: {},
          locator: { sheet: table.sheet },
          calculation: "(Q_latest-Q_prev)/Q_prev",
        });
      }
    }
  }

  const costCol = mapping.metrics.find((col) => slugToken(col) === "cost");
  const revenueCol = mapping.metrics.find((col) => slugToken(col) === "revenue");
  if (costCol && ordersCol) {
    const cost = sumMetric(latest, costCol);
    const orders = sumMetric(latest, ordersCol);
    if (orders > 0) {
      push({
        id: `fact_cpa_${periodSlug(latest)}`,
        sourceId,
        label: `${periodLabel(latest)} 获客成本`,
        value: Math.round(cost / orders),
        unit: "元",
        period: latest,
        dimensions: {},
        locator: { sheet: table.sheet },
        calculation: "cost/orders",
      });
    }
  }

  if (revenueCol && dimCol) {
    const total = sumMetric(latest, revenueCol);
    const dimValues = uniqueSorted(
      rowsFor(latest)
        .map((row) => String(row[dimCol] ?? ""))
        .filter(Boolean),
    );
    if (total > 0) {
      const ranked = dimValues
        .map((dimValue) => ({
          dimValue,
          value: sumMetric(latest, revenueCol, dimValue),
        }))
        .sort((a, b) => b.value - a.value);

      ranked.forEach((item, index) => {
        push({
          id: `fact_share_${slugToken(item.dimValue)}_${periodSlug(latest)}`,
          sourceId,
          label: `${item.dimValue}收入占比`,
          value: round1((item.value / total) * 100),
          unit: "%",
          period: latest,
          dimensions: { channel: item.dimValue },
          locator: { sheet: table.sheet },
          calculation: "channel_revenue / period_revenue",
        });
        if (index < 3) {
          push({
            id: `fact_top_${index + 1}_${periodSlug(latest)}`,
            sourceId,
            label: `收入第${index + 1}渠道`,
            value: item.dimValue,
            unit: null,
            period: latest,
            dimensions: { channel: item.dimValue },
            locator: { sheet: table.sheet },
            calculation: "rank by revenue",
          });
        }
      });

      ranked.slice(-3).forEach((item, index) => {
        push({
          id: `fact_bottom_${index + 1}_${periodSlug(latest)}`,
          sourceId,
          label: `收入倒数第${ranked.length - ranked.indexOf(item)}渠道`,
          value: item.dimValue,
          unit: null,
          period: latest,
          dimensions: { channel: item.dimValue },
          locator: { sheet: table.sheet },
        });
      });
    }
  }

  const seen = new Set<string>();
  return facts.filter((fact) => {
    if (seen.has(fact.id)) {
      return false;
    }
    seen.add(fact.id);
    return true;
  });
}
