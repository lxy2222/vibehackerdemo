import {
  numericValue,
} from "@/lib/presentation/facts";
import type { Fact } from "@/lib/presentation/types";

export type ChartSeries = {
  name: string;
  labels: string[];
  values: number[];
};

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function dimKeyOf(facts: Fact[]): string | null {
  for (const fact of facts) {
    const keys = Object.keys(fact.dimensions);
    if (keys[0]) {
      return keys[0];
    }
  }
  return null;
}

export function lineSeriesFromFacts(facts: Fact[]): ChartSeries[] {
  const numeric = facts.filter((fact) => typeof fact.value === "number");
  const periods = unique(numeric.map((fact) => fact.period)).sort();
  const dimKey = dimKeyOf(numeric);

  if (periods.length > 0 && dimKey) {
    const names = unique(numeric.map((fact) => fact.dimensions[dimKey]));
    return names.map((name) => ({
      name,
      labels: periods,
      values: periods.map((period) => {
        const fact = numeric.find(
          (item) => item.period === period && item.dimensions[dimKey] === name,
        );
        return numericValue(fact) ?? 0;
      }),
    }));
  }

  if (periods.length > 0) {
    return [
      {
        name: numeric[0]?.label ?? "指标",
        labels: periods,
        values: periods.map((period) => {
          const fact = numeric.find((item) => item.period === period && !dimKeyOf([item]));
          return numericValue(fact) ?? 0;
        }),
      },
    ];
  }

  return [
    {
      name: numeric[0]?.label ?? "指标",
      labels: numeric.map((fact) => fact.dimensions[dimKey ?? ""] || fact.label),
      values: numeric.map((fact) => numericValue(fact) ?? 0),
    },
  ];
}

export function barPointsFromFacts(facts: Fact[]): { labels: string[]; values: number[] } {
  const numeric = facts.filter((fact) => typeof fact.value === "number");
  const dimKey = dimKeyOf(numeric);
  return {
    labels: numeric.map((fact) => fact.dimensions[dimKey ?? ""] || fact.label),
    values: numeric.map((fact) => numericValue(fact) ?? 0),
  };
}

export function footerSource(facts: Fact[], fallback = "已整理材料"): string {
  const names = unique(facts.map((fact) => fact.sourceId.split(/[/\\]/).pop()));
  return names.length > 0 ? `来源：${names.join("、")}` : `来源：${fallback}`;
}
