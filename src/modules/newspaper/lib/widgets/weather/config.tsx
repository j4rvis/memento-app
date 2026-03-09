"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { WidgetConfigProps } from "../types";

export function WeatherConfig({ config = {} }: WidgetConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Location</Label>
      <Input
        name="config_location"
        defaultValue={(config.location as string) ?? ""}
        placeholder="e.g. Berlin"
        className="h-8 text-sm"
      />
    </div>
  );
}
