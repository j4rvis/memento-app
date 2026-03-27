"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncGoogleAccount } from "../actions";
import { toast } from "sonner";

interface SyncGoogleButtonProps {
  slug: string;
  accountId: string;
}

export function SyncGoogleButton({ slug, accountId }: SyncGoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      await syncGoogleAccount(slug, accountId);
      toast.success("Calendar synced");
    } catch {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSync}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </Button>
  );
}
