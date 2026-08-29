import { PreviewView } from "@/components/preview-view";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PreviewView id={id} />;
}
