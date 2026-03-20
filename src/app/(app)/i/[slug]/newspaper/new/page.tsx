import { redirect } from "next/navigation";
import { resolveInstance } from "@/lib/instance/server";
import { createTemplate } from "../actions";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await resolveInstance(slug);
  const id = await createTemplate(slug, "Untitled Newspaper");
  redirect(`/i/${slug}/newspaper/${id}`);
}
