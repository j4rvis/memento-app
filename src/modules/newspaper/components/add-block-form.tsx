"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBlock } from "@/app/(app)/i/[slug]/newspaper/actions";
import { Plus } from "lucide-react";

const BLOCK_TYPES = [
  { value: "weather", label: "Weather", defaultConfig: '{"location":"Berlin"}' },
  { value: "rss", label: "RSS Feed", defaultConfig: '{"feed_id":"","max_items":5}' },
  { value: "notes", label: "Notes", defaultConfig: '{"filter":"pinned"}' },
  { value: "text", label: "Static Text", defaultConfig: '{"body":""}' },
  { value: "articles", label: "Articles", defaultConfig: '{"max_items":5}' },
  { value: "todos", label: "Todos", defaultConfig: '{"max_items":10}' },
];

export function AddBlockForm({ newspaperId, slug }: { newspaperId: string; slug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [blockType, setBlockType] = useState("text");

  const selectedType = BLOCK_TYPES.find((t) => t.value === blockType);

  if (!isOpen) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Block
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addBlock(slug, newspaperId, formData);
        setIsOpen(false);
      }}
      className="space-y-3 rounded-lg border p-4"
    >
      <div className="space-y-2">
        <Label>Block Type</Label>
        <select
          name="block_type"
          value={blockType}
          onChange={(e) => setBlockType(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input name="title" defaultValue={selectedType?.label} />
      </div>
      <div className="space-y-2">
        <Label>Config (JSON)</Label>
        <textarea
          name="config"
          defaultValue={selectedType?.defaultConfig}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono h-20 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Block</Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
