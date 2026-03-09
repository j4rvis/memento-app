"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetConfigProps } from "../types";

export function HeaderConfig({ config }: WidgetConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Location (for weather)</Label>
        <Input
          name="config_location"
          placeholder="e.g. London"
          defaultValue={(config?.location as string) ?? ""}
        />
        <p className="text-xs text-muted-foreground">Leave blank to skip weather</p>
      </div>
      <div className="space-y-1">
        <Label>Tagline</Label>
        <Input
          name="config_tagline"
          placeholder="e.g. All the news fit to print"
          defaultValue={(config?.tagline as string) ?? ""}
        />
      </div>
    </div>
  );
}
