import { resolveInstance } from "@/lib/instance/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiClientsList } from "@/modules/api-clients/components/api-clients-list";

export default async function ApiSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { role } = await resolveInstance(slug);

  if (role !== "owner" && role !== "admin") {
    redirect(`/i/${slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}/settings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">API Access</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        API clients allow external tools (Obsidian, Home Assistant, scripts) to access this
        workspace via the REST API. Each client has its own credentials and scope.
      </p>

      <ApiClientsList slug={slug} />
    </div>
  );
}
