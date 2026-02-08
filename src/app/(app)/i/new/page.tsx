import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewInstancePage() {
  async function createInstance(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    const { data: instance, error } = await supabase
      .from("instances")
      .insert({ name, slug, owner_id: user.id })
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    await supabase
      .from("instance_memberships")
      .insert({ instance_id: instance.id, user_id: user.id, role: "owner" });

    redirect(`/i/${instance.slug}/todos`);
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInstance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Workspace"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="my-workspace"
                pattern="^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$"
                title="3-48 characters, lowercase letters, numbers, and hyphens only"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens. 3-48 characters.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Create Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
