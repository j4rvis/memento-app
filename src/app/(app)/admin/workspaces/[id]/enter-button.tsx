"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { enterWorkspace } from "../../actions";

export function AdminEnterButton({
  instanceId,
  slug,
}: {
  instanceId: string;
  slug: string;
}) {
  const [role, setRole] = useState("member");

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
      </select>
      <Button onClick={() => enterWorkspace(instanceId, slug, role)}>
        <LogIn className="mr-2 h-4 w-4" />
        Enter Workspace
      </Button>
    </div>
  );
}
