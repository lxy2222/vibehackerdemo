import fs from "node:fs/promises";
import path from "node:path";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 3;

const ALLOWED: Record<string, { ext: string[]; mime: string[] }> = {
  notes: {
    ext: [".txt", ".md"],
    mime: ["text/plain", "text/markdown", "text/x-markdown", "application/octet-stream"],
  },
  data: {
    ext: [".csv", ".xlsx"],
    mime: [
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ],
  },
  leader: {
    ext: [".txt", ".md"],
    mime: ["text/plain", "text/markdown", "text/x-markdown", "application/octet-stream"],
  },
};

export type FileKind = "notes" | "data" | "leader";

export function kindFromFilename(filename: string): FileKind | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".csv" || ext === ".xlsx") {
    return "data";
  }
  if (ext === ".txt" || ext === ".md") {
    return "notes";
  }
  return null;
}

export function assertAllowedFile(kind: FileKind, filename: string, mime: string, size: number) {
  if (size > MAX_FILE_BYTES) {
    throw new Error("单个文件不能超过 10MB");
  }
  const ext = path.extname(filename).toLowerCase();
  const rule = ALLOWED[kind];
  if (!rule.ext.includes(ext)) {
    throw new Error("不支持的文件类型");
  }
  if (mime && !rule.mime.includes(mime) && mime !== "") {
    // Some browsers send empty or odd MIME; extension already checked.
    if (!rule.mime.includes(mime)) {
      if (mime !== "application/octet-stream" && !mime.startsWith("text/")) {
        throw new Error("不支持的文件类型");
      }
    }
  }
}

export function safeFilename(filename: string): string {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "_")
    .slice(0, 80);
}

export async function saveUpload(projectId: string, fileId: string, filename: string, bytes: Buffer) {
  const dir = path.join(process.cwd(), "uploads", projectId);
  await fs.mkdir(dir, { recursive: true });
  const stored = path.join(dir, `${fileId}-${safeFilename(filename)}`);
  await fs.writeFile(stored, bytes);
  return stored;
}

export async function saveArtifact(deckId: string, bytes: Buffer) {
  const dir = path.join(process.cwd(), "artifacts");
  await fs.mkdir(dir, { recursive: true });
  const stored = path.join(dir, `${deckId}.pptx`);
  await fs.writeFile(stored, bytes);
  return stored;
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function copyDemoFiles(projectId: string): Promise<
  { kind: FileKind; filename: string; mime: string; path: string; id: string }[]
> {
  const demoDir = path.join(process.cwd(), "fixtures", "demo");
  const items: { kind: FileKind; filename: string; mime: string }[] = [
    { kind: "notes", filename: "meeting-notes.md", mime: "text/markdown" },
    { kind: "data", filename: "campaign-data.csv", mime: "text/csv" },
  ];

  const saved = [];
  for (const item of items) {
    const id = crypto.randomUUID();
    const bytes = await fs.readFile(path.join(demoDir, item.filename));
    const stored = await saveUpload(projectId, id, item.filename, bytes);
    saved.push({ ...item, id, path: stored });
  }
  return saved;
}

export async function readDemoLeaderRequest(): Promise<string> {
  const file = path.join(process.cwd(), "fixtures", "demo", "leader-request.txt");
  return fs.readFile(file, "utf8");
}
