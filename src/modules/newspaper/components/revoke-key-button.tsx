"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeApiKey } from "@/app/(app)/i/[slug]/settings/actions";
import { Trash2 } from "lucide-react";

interface RevokeKeyButtonProps {
  slug: string;
  keyId: string;
  keyName: string;
}

export function RevokeKeyButton({ slug, keyId, keyName }: RevokeKeyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm(`Revoke "${keyName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await revokeApiKey(slug, keyId);
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
