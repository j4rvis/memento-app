import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { BlockEditor } from "@/modules/newspaper/components/block-editor";
import { AddBlockForm } from "@/modules/newspaper/components/add-block-form";
import { updateNewspaper, deleteNewspaper, generateEdition } from "../actions";

export default async function NewspaperDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  await resolveInstance(slug);
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);

  const [
    { data: newspaper },
    { data: blocks },
    { data: feeds },
    { data: articles },
  ] = await Promise.all([
    supabase.from("newspapers").select("*").eq("id", id).single(),
    supabase
      .from("newspaper_blocks")
      .select("*")
      .eq("newspaper_id", id)
      .order("sort_order"),
    supabase
      .from("feeds")
      .select("id, title")
      .eq("instance_id", instanceId)
      .order("title"),
    supabase
      .from("articles")
      .select("id, title")
      .eq("instance_id", instanceId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!newspaper) notFound();

  const pc = (newspaper.print_config && typeof newspaper.print_config === "object" && !Array.isArray(newspaper.print_config)
    ? newspaper.print_config
    : {}) as Record<string, string>;

  const feedOptions = feeds ?? [];
  const articleOptions = (articles ?? []).map((a) => ({
    id: a.id,
    title: a.title ?? "(untitled)",
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}/newspaper`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">{newspaper.title}</h1>
        <form action={async () => { "use server"; await generateEdition(slug, id); }}>
          <Button size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Generate & Preview
          </Button>
        </form>
        <form action={async () => { "use server"; await deleteNewspaper(slug, id); }}>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>

      <form
        action={async (formData) => { "use server"; await updateNewspaper(slug, id, formData); }}
        className="space-y-4 rounded-lg border p-4"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={newspaper.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" defaultValue={newspaper.description ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kindle_email">Kindle Email (optional)</Label>
          <Input
            id="kindle_email"
            name="kindle_email"
            type="email"
            defaultValue={newspaper.kindle_email ?? ""}
            placeholder="your-kindle@kindle.com"
          />
        </div>

        <Separator />
        <p className="text-sm font-medium">Print Settings</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="print_font_family">Font</Label>
            <select
              id="print_font_family"
              name="print_font_family"
              defaultValue={pc.font_family ?? "serif"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="serif">Serif (classic)</option>
              <option value="sans">Sans-serif (modern)</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="print_font_size">Font Size</Label>
            <select
              id="print_font_size"
              name="print_font_size"
              defaultValue={pc.font_size ?? "md"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="print_line_height">Line Spacing</Label>
            <select
              id="print_line_height"
              name="print_line_height"
              defaultValue={pc.line_height ?? "relaxed"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="print_columns">Layout</Label>
            <select
              id="print_columns"
              name="print_columns"
              defaultValue={pc.columns ?? "1"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="1">Single column</option>
              <option value="2">Two columns</option>
            </select>
          </div>
        </div>

        <Button type="submit" variant="outline">
          Save Settings
        </Button>
      </form>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Content Blocks</h2>
        {blocks && blocks.length > 0 ? (
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
                slug={slug}
                feeds={feedOptions}
                articles={articleOptions}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No blocks yet. Add your first block below.</p>
        )}
        <AddBlockForm
          newspaperId={id}
          slug={slug}
          feeds={feedOptions}
          articles={articleOptions}
        />
      </div>
    </div>
  );
}
