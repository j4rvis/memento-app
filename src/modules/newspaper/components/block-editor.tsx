"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { deleteBlock, moveBlock, updateBlock } from "@/app/(app)/i/[slug]/newspaper/actions";
import { useState } from "react";

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
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  slug: string;
}) {
  const [title, setTitle] = useState(block.title);
  const [config, setConfig] = useState(JSON.stringify(block.config, null, 2));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{block.block_type}</Badge>
          <CardTitle className="text-sm flex-1">{block.title}</CardTitle>
          <div className="flex gap-1">
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
      <CardContent>
        <form
          action={async (formData) => { await updateBlock(slug, block.id, formData); }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Config (JSON)</Label>
            <textarea
              name="config"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono h-20 resize-none"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Update
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
