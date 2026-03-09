"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetConfigProps } from "../types";

export function ImageConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Image URL</Label>
        <Input
          name="config_url"
          placeholder="https://images.unsplash.com/photo-…"
          defaultValue={(config.url as string) ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Paste any image URL. Leave blank to use the keywords below.
        </p>
      </div>
      <div className="space-y-1">
        <Label>Keywords (Unsplash fallback)</Label>
        <Input
          name="config_keywords"
          placeholder="e.g. nature, mountains, city"
          defaultValue={(config.keywords as string) ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Used when no URL is provided. Picks a photo matching these themes.
        </p>
      </div>
      <div className="space-y-1">
        <Label>Caption</Label>
        <Input
          name="config_caption"
          placeholder="Photo caption…"
          defaultValue={(config.caption as string) ?? ""}
        />
      </div>
    </div>
  );
}
