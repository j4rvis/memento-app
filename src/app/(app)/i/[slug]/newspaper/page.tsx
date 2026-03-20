import { resolveInstance } from "@/lib/instance/server";
import { listTemplates } from "./actions";
import { NewspaperTemplateList } from "@/modules/newspaper/components/newspaper-template-list";

export default async function NewspaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await resolveInstance(slug);
  const templates = await listTemplates(slug);

  return <NewspaperTemplateList slug={slug} templates={templates} />;
}
