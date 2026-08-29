"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadProject, saveProject } from "@/lib/projects/session";
import type { ProjectDTO } from "@/lib/projects/types";

export function ProjectGate({
  id,
  children,
}: {
  id: string;
  children: (project: ProjectDTO, setProject: (project: ProjectDTO) => void) => ReactNode;
}) {
  const router = useRouter();
  const [project, setProjectState] = useState<ProjectDTO | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadProject(id);
    setProjectState(loaded);
    setReady(true);
    if (!loaded) {
      router.replace("/");
    }
  }, [id, router]);

  function setProject(next: ProjectDTO) {
    saveProject(next);
    setProjectState(next);
  }

  if (!ready) {
    return <p className="text-base text-[var(--olive)]">正在读取本次演示草稿…</p>;
  }
  if (!project) {
    return null;
  }
  return <>{children(project, setProject)}</>;
}
