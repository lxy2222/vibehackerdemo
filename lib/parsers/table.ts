import * as XLSX from "xlsx";
import type { ColumnMapping } from "@/lib/schemas/requirement";

export type ParsedTable = {
  sheet: string;
  headers: string[];
  rows: Record<string, string | number | null>[];
};

const PERIOD_RE =
  /^(period|date|日期|时间|季度|quarter|月份|month|week|周|年月)$/i;
const DIMENSION_RE =
  /^(channel|渠道|部门|产品|地区|region|category|类别|type|类型)$/i;
const SKIP_RE = /^(id|序号|index|no|编号)$/i;

export function parseSpreadsheet(buffer: Buffer, filename: string): ParsedTable {
  const isCsv = filename.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(buffer.toString("utf8"), { type: "string", raw: true })
    : XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("表格是空的");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const headerRow = matrix.find((row) =>
    row.some((cell) => cell !== null && String(cell).trim() !== ""),
  );
  if (!headerRow) {
    throw new Error("表格没有表头");
  }

  const headers = headerRow.map((cell, index) => {
    const label = String(cell ?? "").trim();
    return label || `列${index + 1}`;
  });

  const start = matrix.indexOf(headerRow) + 1;
  const rows: Record<string, string | number | null>[] = [];
  for (const raw of matrix.slice(start)) {
    if (!raw.some((cell) => cell !== null && String(cell).trim() !== "")) {
      continue;
    }
    const row: Record<string, string | number | null> = {};
    headers.forEach((header, index) => {
      const value = raw[index];
      if (value === null || value === undefined || String(value).trim() === "") {
        row[header] = null;
        return;
      }
      if (typeof value === "number") {
        row[header] = value;
        return;
      }
      const asNumber = Number(String(value).replace(/,/g, ""));
      row[header] = Number.isFinite(asNumber) && String(value).trim() !== "" && /[\d.]/.test(String(value))
        ? asNumber
        : String(value).trim();
    });
    rows.push(row);
  }

  return { sheet: sheetName || filename, headers, rows };
}

export function detectColumnMapping(table: ParsedTable): ColumnMapping {
  const numericScores = new Map<string, number>();
  for (const header of table.headers) {
    let numeric = 0;
    let total = 0;
    for (const row of table.rows) {
      const value = row[header];
      if (value === null) {
        continue;
      }
      total += 1;
      if (typeof value === "number") {
        numeric += 1;
      }
    }
    numericScores.set(header, total === 0 ? 0 : numeric / total);
  }

  const period =
    table.headers.find((header) => PERIOD_RE.test(header)) ??
    table.headers.find((header) => {
      const values = table.rows.map((row) => String(row[header] ?? ""));
      const quarterLike = values.filter((value) => /Q[1-4]|^\d{4}/.test(value)).length;
      return values.length > 0 && quarterLike / values.length > 0.6;
    }) ??
    null;

  const dimensions = table.headers.filter((header) => {
    if (header === period || SKIP_RE.test(header)) {
      return false;
    }
    if (DIMENSION_RE.test(header)) {
      return true;
    }
    return (numericScores.get(header) ?? 0) < 0.4;
  });

  const metrics = table.headers.filter((header) => {
    if (header === period || dimensions.includes(header) || SKIP_RE.test(header)) {
      return false;
    }
    return (numericScores.get(header) ?? 0) >= 0.6;
  });

  const confidence: ColumnMapping["confidence"] =
    period && metrics.length > 0 ? "high" : "low";

  return {
    period,
    dimensions,
    metrics,
    headers: table.headers,
    confidence,
  };
}
