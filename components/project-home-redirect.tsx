"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProject } from "@/lib/projects/session";

export function ProjectHomeRedirect({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    const project = loadProject(id);
    if (!project) {
      router.replace("/");
      return;
    }
    router.replace(project.deck ? `/projects/${id}/preview` : `/projects/${id}/outline`);
  }, [id, router]);

  return <p className="text-base text-[var(--olive)]">正在打开本次演示草稿…</p>;
}
