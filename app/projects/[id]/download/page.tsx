import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function DownloadRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}/preview`);
}
