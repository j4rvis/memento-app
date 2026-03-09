"use client";

import { Label } from "@/components/ui/label";
import type { WidgetConfigProps } from "../types";

export function TextConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Content</Label>
      <textarea
        name="config_body"
        defaultValue={(config.body as string) ?? ""}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm h-24 resize-none"
        placeholder="Static text content…"
      />
    </div>
  );
}
