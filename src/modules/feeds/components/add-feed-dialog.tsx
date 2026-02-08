"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addFeed } from "@/app/(app)/i/[slug]/feeds/actions";
import { Plus } from "lucide-react";

export function AddFeedDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Feed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add RSS Feed</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await addFeed(slug, formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="url">Feed URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/feed.xml"
              required
            />
          </div>
          <SubmitButton pendingText="Adding..." className="w-full">
            Add Feed
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
