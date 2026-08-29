export type FormDraft = {
  reportBackground: string;
  materials: string;
  durationMinutes?: number;
};

const CREATE_KEY = "huibao:create-draft";

function confirmKey(projectId: string) {
  return `huibao:confirm-draft:${projectId}`;
}

function readDraft(key: string): FormDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as FormDraft;
    if (typeof parsed.reportBackground !== "string") {
      return null;
    }
    return {
      reportBackground: parsed.reportBackground,
      materials: typeof parsed.materials === "string" ? parsed.materials : "",
      durationMinutes:
        typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0
          ? parsed.durationMinutes
          : undefined,
    };
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: FormDraft) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(key, JSON.stringify(draft));
}

export function saveCreateDraft(draft: FormDraft) {
  writeDraft(CREATE_KEY, draft);
}

export function loadCreateDraft() {
  return readDraft(CREATE_KEY);
}

export function clearCreateDraft() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(CREATE_KEY);
}

export function saveConfirmDraft(projectId: string, draft: FormDraft) {
  writeDraft(confirmKey(projectId), draft);
}

export function loadConfirmDraft(projectId: string) {
  return readDraft(confirmKey(projectId));
}

export function clearConfirmDraft(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(confirmKey(projectId));
}
