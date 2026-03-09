"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { WidgetConfigProps } from "../types";

export function CalendarConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Days ahead</Label>
      <Input
        name="config_days_ahead"
        type="number"
        min={1}
        max={30}
        defaultValue={(config.days_ahead as number) ?? 7}
        className="h-8 text-sm w-24"
      />
    </div>
  );
}
