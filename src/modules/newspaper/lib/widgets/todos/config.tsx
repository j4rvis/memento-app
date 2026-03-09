"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { WidgetConfigProps } from "../types";

export function TodosConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Max items</Label>
      <Input
        name="config_max_items"
        type="number"
        min={1}
        max={50}
        defaultValue={(config.max_items as number) ?? 10}
        className="h-8 text-sm w-24"
      />
    </div>
  );
}
