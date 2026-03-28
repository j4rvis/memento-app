"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { getXResources, subscribeToXResource, type XResource } from "@/app/(app)/i/[slug]/feeds/actions";
import { toast } from "sonner";

export function AddXFeedDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<XResource[] | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && resources === null) {
      setLoading(true);
      try {
        const data = await getXResources(slug);
        setResources(data);
      } catch {
        toast.error("Failed to load X resources");
        setResources([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleSubscribe(resource: XResource) {
    setSubscribing(resource.id);
    try {
      await subscribeToXResource(slug, resource.id, resource.type, resource.name);
      toast.success(`Subscribed to ${resource.name}`);
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add X Feed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add X (Twitter) Feed</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : resources && resources.length > 0 ? (
            resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{resource.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={subscribing === resource.id}
                  onClick={() => handleSubscribe(resource)}
                >
                  {subscribing === resource.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No lists or timelines found. Make sure your X account is connected in Settings → Integrations.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
