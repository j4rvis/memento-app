import { redirect } from "next/navigation";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  redirect(`/i/${slug}/articles?article=${id}`);
}
