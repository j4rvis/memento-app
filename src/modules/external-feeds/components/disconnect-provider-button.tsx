"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { disconnectExternalConnection } from "@/app/(app)/i/[slug]/settings/actions";

interface DisconnectProviderButtonProps {
  slug: string;
  connectionId: string;
  providerUsername: string;
}

export function DisconnectProviderButton({
  slug,
  connectionId,
  providerUsername,
}: DisconnectProviderButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (
      !confirm(
        `Disconnect @${providerUsername}? This will remove all synced feeds and their entries.`
      )
    )
      return;
    setLoading(true);
    try {
      await disconnectExternalConnection(slug, connectionId);
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
