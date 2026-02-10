import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { resolveInstance } from "@/lib/instance/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Newspaper, Plus } from "lucide-react";
import { createNewspaper } from "./actions";
import Link from "next/link";

export default async function NewspaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: newspapers } = await supabase
    .from("newspapers")
    .select("*, newspaper_blocks(count)")
    .eq("instance_id", instance.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Newspaper</h1>
        <form action={async () => { "use server"; await createNewspaper(slug); }}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Newspaper
          </Button>
        </form>
      </div>

      {newspapers && newspapers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newspapers.map((paper) => (
            <Link key={paper.id} href={`/i/${slug}/newspaper/${paper.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{paper.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {paper.description || "No description"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created {formatDate(paper.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No newspapers yet"
          description="Create your first newspaper to get started."
        />
      )}
    </div>
  );
}
