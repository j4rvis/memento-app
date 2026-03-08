"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { deleteBlock, moveBlock, updateBlock } from "@/app/(app)/i/[slug]/newspaper/actions";
import { BlockConfigFields, type FeedOption, type ArticleOption } from "./block-config-fields";

const BLOCK_TYPES = [
  { value: "weather", label: "Weather" },
  { value: "rss", label: "RSS Feed" },
  { value: "notes", label: "Notes" },
  { value: "text", label: "Static Text" },
  { value: "articles", label: "Articles" },
  { value: "todos", label: "Todos" },
  { value: "calendar", label: "Calendar" },
];

interface Block {
  id: string;
  newspaper_id: string;
  block_type: string;
  title: string;
  config: Record<string, unknown>;
  sort_order: number;
}

export function BlockEditor({
  block,
  isFirst,
  isLast,
  slug,
  feeds,
  articles,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  slug: string;
  feeds: FeedOption[];
  articles: ArticleOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [blockType, setBlockType] = useState(block.block_type);
  const [title, setTitle] = useState(block.title);
  const [configKey, setConfigKey] = useState(0);
  const [activeConfig, setActiveConfig] = useState(block.config);

  function handleTypeChange(newType: string) {
    const found = BLOCK_TYPES.find((t) => t.value === newType);
    setBlockType(newType);
    setTitle(found?.label ?? newType);
    setActiveConfig({});
    setConfigKey((k) => k + 1);
  }

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <Badge variant="outline" className="shrink-0 text-xs">{blockType}</Badge>
            <span className="text-sm font-medium truncate">{title}</span>
          </button>
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={isFirst}
              onClick={() => moveBlock(slug, block.id, block.newspaper_id, "up")}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={isLast}
              onClick={() => moveBlock(slug, block.id, block.newspaper_id, "down")}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => deleteBlock(slug, block.id, block.newspaper_id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-3 px-3 border-t">
          <form
            action={async (formData) => { await updateBlock(slug, block.id, formData); }}
            className="space-y-3 pt-3"
          >
            <input type="hidden" name="block_type" value={blockType} />
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={blockType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                {BLOCK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <BlockConfigFields
              key={configKey}
              blockType={blockType}
              config={activeConfig}
              feeds={feeds}
              articles={articles}
            />
            <SubmitButton size="sm" variant="outline">
              Update
            </SubmitButton>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
