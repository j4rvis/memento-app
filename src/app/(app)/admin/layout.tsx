import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
        <Shield className="h-5 w-5 text-destructive" />
        <span className="font-semibold">Admin</span>
        <nav className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/workspaces">Workspaces</Link>
          </Button>
        </nav>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/i">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Link>
        </Button>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
