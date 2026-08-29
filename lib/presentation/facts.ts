import type { Fact } from "@/lib/presentation/types";

export function factMap(facts: Fact[]): Map<string, Fact> {
  return new Map(facts.map((fact) => [fact.id, fact]));
}

export function formatFactValue(fact: Fact): string {
  if (typeof fact.value === "string") {
    return fact.unit ? `${fact.value}${fact.unit}` : fact.value;
  }

  if (fact.unit === "%") {
    return `${fact.value.toFixed(1)}%`;
  }

  const formatted = fact.value.toLocaleString("zh-CN");
  if (fact.unit === "元") {
    if (Math.abs(fact.value) >= 10000) {
      return `${(fact.value / 10000).toFixed(1)} 万元`;
    }
    return `${formatted} 元`;
  }

  if (fact.unit === "项") {
    return formatted;
  }

  return fact.unit ? `${formatted} ${fact.unit}` : formatted;
}

export function interpolate(text: string, facts: Map<string, Fact>): string {
  return text.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, id: string) => {
    const fact = facts.get(id);
    return fact ? formatFactValue(fact) : "资料未提供";
  });
}

export function resolveFacts(ids: string[], facts: Map<string, Fact>): Fact[] {
  return ids.flatMap((id) => {
    const fact = facts.get(id);
    return fact ? [fact] : [];
  });
}

export function numericValue(fact: Fact | undefined): number | null {
  if (!fact || typeof fact.value !== "number") {
    return null;
  }
  return fact.value;
}
