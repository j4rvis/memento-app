"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createApiKey } from "@/app/(app)/i/[slug]/settings/actions";
import { RevealKeyDialog } from "./reveal-key-dialog";

const SCOPES = [
  { value: "read:pdf", label: "read:pdf", description: "Download PDFs", defaultOn: true },
  { value: "write:generate", label: "write:generate", description: "Trigger generation", defaultOn: false },
];

interface CreateApiKeyDialogProps {
  slug: string;
}

export function CreateApiKeyDialog({ slug }: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:pdf"]);
  const [loading, setLoading] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setLoading(true);
    try {
      const { rawKey: key } = await createApiKey(slug, { name: name.trim(), scopes });
      setRawKey(key);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (rawKey) {
    return (
      <RevealKeyDialog
        rawKey={rawKey}
        onClose={() => {
          setRawKey(null);
          setName("");
          setScopes(["read:pdf"]);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              placeholder="e.g. HomeAssistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Scopes</Label>
            {SCOPES.map((scope) => (
              <label key={scope.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope.value)}
                  onChange={() => toggleScope(scope.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  <code className="text-xs">{scope.label}</code>
                  <span className="ml-2 text-muted-foreground">{scope.description}</span>
                </span>
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={loading || scopes.length === 0}>
            {loading ? "Creating…" : "Create Key"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
