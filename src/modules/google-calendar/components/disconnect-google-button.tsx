"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { disconnectGoogleAccount } from "../actions";

interface DisconnectGoogleButtonProps {
  slug: string;
  accountId: string;
  email: string;
}

export function DisconnectGoogleButton({ slug, accountId, email }: DisconnectGoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm(`Disconnect "${email}"? This will remove all synced calendar events.`)) return;
    setLoading(true);
    try {
      await disconnectGoogleAccount(slug, accountId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDisconnect}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
