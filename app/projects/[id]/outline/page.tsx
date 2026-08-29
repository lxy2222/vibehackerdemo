import { OutlineView } from "@/components/outline-view";

export default async function OutlinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OutlineView id={id} />;
}
