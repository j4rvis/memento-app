import { redirect } from "next/navigation";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  redirect(`/i/${slug}/notes?note=${id}`);
}
