import { resolveInstance } from "@/lib/instance/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GoogleAccountsCard } from "@/modules/google-calendar/components/google-accounts-card";

export default async function IntegrationsSettingsPage({
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
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      <GoogleAccountsCard slug={slug} />
    </div>
  );
}
