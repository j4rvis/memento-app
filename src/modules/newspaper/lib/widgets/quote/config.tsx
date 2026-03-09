"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetConfigProps } from "../types";

export function QuoteConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Quote text</Label>
        <textarea
          name="config_text"
          defaultValue={(config.text as string) ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm h-20 resize-none"
          placeholder="Enter an inspiring quote…"
        />
      </div>
      <div className="space-y-1">
        <Label>Attribution</Label>
        <Input
          name="config_attribution"
          placeholder="e.g. Marcus Aurelius"
          defaultValue={(config.attribution as string) ?? ""}
        />
      </div>
    </div>
  );
}
