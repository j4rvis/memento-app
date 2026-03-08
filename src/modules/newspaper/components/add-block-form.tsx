"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBlock } from "@/app/(app)/i/[slug]/newspaper/actions";
import { BlockConfigFields, type FeedOption, type ArticleOption } from "./block-config-fields";
import { Plus } from "lucide-react";

const BLOCK_TYPES = [
  { value: "weather", label: "Weather" },
  { value: "rss", label: "RSS Feed" },
  { value: "notes", label: "Notes" },
  { value: "text", label: "Static Text" },
  { value: "articles", label: "Articles" },
  { value: "todos", label: "Todos" },
  { value: "calendar", label: "Calendar" },
];

export function AddBlockForm({
  newspaperId,
  slug,
  feeds,
  articles,
}: {
  newspaperId: string;
  slug: string;
  feeds: FeedOption[];
  articles: ArticleOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [blockType, setBlockType] = useState("text");
  const [title, setTitle] = useState("Static Text");

  function handleTypeChange(newType: string) {
    const found = BLOCK_TYPES.find((t) => t.value === newType);
    setBlockType(newType);
    setTitle(found?.label ?? newType);
  }

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
      <input type="hidden" name="block_type" value={blockType} />
      <div className="space-y-2">
        <Label>Block Type</Label>
        <select
          value={blockType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <BlockConfigFields
        key={blockType}
        blockType={blockType}
        feeds={feeds}
        articles={articles}
      />
      <div className="flex gap-2">
        <SubmitButton>Add Block</SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
