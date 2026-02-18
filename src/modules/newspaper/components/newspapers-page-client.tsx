"use client";

import { useNewspapers } from "../lib/hooks";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Newspaper, Plus } from "lucide-react";
import { createNewspaper } from "@/app/(app)/i/[slug]/newspaper/actions";
import { useInstanceSlug } from "@/lib/instance/context";
import Link from "next/link";

export function NewspapersPageClient({
  initialNewspapers,
}: {
  initialNewspapers: unknown[];
}) {
  const slug = useInstanceSlug();
  const { data: newspapers } = useNewspapers(initialNewspapers);
  const displayNewspapers = (newspapers ?? initialNewspapers) as {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Newspaper</h1>
        <form action={async () => { await createNewspaper(slug); }}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Newspaper
          </Button>
        </form>
      </div>

      {displayNewspapers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayNewspapers.map((paper) => (
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
