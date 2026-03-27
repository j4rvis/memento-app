"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeApiClient } from "../actions";
import { Trash2 } from "lucide-react";

interface RevokeClientButtonProps {
  slug: string;
  clientId: string;
  clientName: string;
}

export function RevokeClientButton({ slug, clientId, clientName }: RevokeClientButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm(`Revoke "${clientName}"? Active tokens will remain valid until they expire (24h).`)) return;
    setLoading(true);
    try {
      await revokeApiClient(slug, clientId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRevoke}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
