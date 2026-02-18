import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/lib/query/provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <QueryProvider>{children}</QueryProvider>;
}
