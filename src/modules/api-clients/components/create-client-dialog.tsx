"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Check } from "lucide-react";
import { createApiClient } from "../actions";

const AVAILABLE_SCOPES = [
  { value: "todos:read", label: "todos:read", description: "Read todos" },
  { value: "todos:write", label: "todos:write", description: "Create, update, delete todos" },
  { value: "bookmarks:read", label: "bookmarks:read", description: "Read bookmarks" },
  { value: "bookmarks:write", label: "bookmarks:write", description: "Create, delete bookmarks" },
  { value: "feeds:read", label: "feeds:read", description: "Read feeds and articles" },
  { value: "feeds:write", label: "feeds:write", description: "Add, delete feeds and articles" },
  { value: "google:read", label: "google:read", description: "Read Google accounts and calendars" },
  { value: "newspaper:write", label: "newspaper:write", description: "Generate newspaper PDFs" },
  { value: "*", label: "*", description: "Full access (all scopes)" },
];

interface RevealSecretProps {
  clientId: string;
  clientSecret: string;
  onClose: () => void;
}

function RevealSecretDialog({ clientId, clientSecret, onClose }: RevealSecretProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  async function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Client Created</DialogTitle>
          <DialogDescription>
            Copy your credentials now. <strong>The client secret will not be shown again.</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Client ID</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <code className="flex-1 break-all text-xs">{clientId}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(clientId, setCopiedId)}>
                {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Client Secret</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <code className="flex-1 break-all text-xs">{clientSecret}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(clientSecret, setCopiedSecret)}>
                {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use these credentials with <code>POST /api/auth/token</code> to obtain a Bearer JWT.
          </p>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateClientDialogProps {
  slug: string;
}

export function CreateClientDialog({ slug }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["todos:read"]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ clientId: string; clientSecret: string } | null>(null);

  function toggleScope(scope: string) {
    if (scope === "*") {
      setScopes(scopes.includes("*") ? [] : ["*"]);
      return;
    }
    setScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope && s !== "*")
        : [...prev.filter((s) => s !== "*"), scope]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setLoading(true);
    try {
      const result = await createApiClient(slug, { name: name.trim(), scopes });
      setCreated(result);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <RevealSecretDialog
        clientId={created.clientId}
        clientSecret={created.clientSecret}
        onClose={() => {
          setCreated(null);
          setName("");
          setScopes(["todos:read"]);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create API Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              placeholder="e.g. Obsidian Plugin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Scopes</Label>
            {AVAILABLE_SCOPES.map((scope) => (
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
            {loading ? "Creating…" : "Create Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
