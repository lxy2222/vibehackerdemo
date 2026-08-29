import type { ProjectDTO } from "@/lib/projects/types";

const PREFIX = "huibao:project:";

function key(id: string) {
  return `${PREFIX}${id}`;
}

export function loadProject(id: string): ProjectDTO | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(key(id));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ProjectDTO;
    if (!parsed || typeof parsed.id !== "string" || parsed.id !== id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProject(project: ProjectDTO) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(key(project.id), JSON.stringify(project));
  } catch {
    throw new Error("本次演示草稿太大，浏览器存不下。请缩短材料后再试。");
  }
}
