import { getProjectDTO } from "@/lib/projects/service";
import { notFound, redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectDTO(id);
  if (!project) {
    notFound();
  }
  redirect(`/projects/${id}/preview`);
}
