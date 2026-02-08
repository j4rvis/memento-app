import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
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

  const { data: newspaper } = await supabase
    .from("newspapers")
    .select("*")
    .eq("id", id)
    .single();

  if (!newspaper) notFound();

  const { data: blocks } = await supabase
    .from("newspaper_blocks")
    .select("*")
    .eq("newspaper_id", id)
    .order("sort_order");

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
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No blocks yet. Add your first block below.</p>
        )}
        <AddBlockForm newspaperId={id} slug={slug} />
      </div>
    </div>
  );
}
