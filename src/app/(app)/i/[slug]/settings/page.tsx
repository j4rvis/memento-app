import { resolveInstance } from "@/lib/instance/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateInstance, updateFeatures } from "./actions";
import type { InstanceFeatures } from "@/lib/instance/types";
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance, role } = await resolveInstance(slug);

  if (role !== "owner" && role !== "admin") {
    redirect(`/i/${slug}`);
  }

  const features = (instance.settings as { features: InstanceFeatures }).features;

  const featureLabels: Record<string, string> = {
    todos: "Todos",
    notes: "Notes",
    feeds: "RSS Feeds",
    articles: "Articles",
    newspaper: "Newspaper",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateInstance(slug, formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={instance.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={instance.slug}
                pattern="^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$"
                required
              />
            </div>
            <Button type="submit" variant="outline">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateFeatures(slug, formData);
            }}
            className="space-y-4"
          >
            {Object.keys(featureLabels).map((key) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={features[key as keyof InstanceFeatures] ?? false}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{featureLabels[key]}</span>
              </label>
            ))}
            <Button type="submit" variant="outline">
              Save Features
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/i/${slug}/settings/members`}>Manage Members</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
