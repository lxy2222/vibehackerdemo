import { ProjectHomeRedirect } from "@/components/project-home-redirect";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="px-6 py-10">
      <ProjectHomeRedirect id={id} />
    </div>
  );
}
