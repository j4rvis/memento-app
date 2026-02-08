import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CheckSquare, FileText } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createServiceRoleClient();

  const [
    { count: userCount },
    { count: instanceCount },
    { count: todoCount },
    { count: noteCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("instances").select("*", { count: "exact", head: true }),
    supabase.from("todos").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Users", value: userCount ?? 0, icon: Users },
    { label: "Workspaces", value: instanceCount ?? 0, icon: Building2 },
    { label: "Todos", value: todoCount ?? 0, icon: CheckSquare },
    { label: "Notes", value: noteCount ?? 0, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
