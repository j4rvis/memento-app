"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Block } from "@/modules/newspaper/lib/types";

interface Props {
  block: Block;
  onChange: (updated: Block) => void;
}

export function BlockConfigPanel({ block, onChange }: Props) {
  const uid = useId();

  if (block.type === "title") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Text" htmlFor={`${uid}-text`}>
          <Input
            id={`${uid}-text`}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
          />
        </Field>
        <Field label="Subtitle" htmlFor={`${uid}-subtitle`}>
          <Input
            id={`${uid}-subtitle`}
            value={block.subtitle ?? ""}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value || undefined })}
          />
        </Field>
        <Field label="Date format" htmlFor={`${uid}-date`}>
          <Input
            id={`${uid}-date`}
            placeholder="e.g. EEEE, MMMM d, yyyy"
            value={block.date_format ?? ""}
            onChange={(e) => onChange({ ...block, date_format: e.target.value || undefined })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Style" htmlFor={`${uid}-style`}>
            <select
              id={`${uid}-style`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.style ?? "newspaper"}
              onChange={(e) => onChange({ ...block, style: e.target.value as typeof block.style })}
            >
              <option value="newspaper">Newspaper</option>
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
            </select>
          </Field>
          <Field label="Border" htmlFor={`${uid}-border`}>
            <select
              id={`${uid}-border`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.border ?? "bottom"}
              onChange={(e) => onChange({ ...block, border: e.target.value as typeof block.border })}
            >
              <option value="none">None</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="both">Both</option>
            </select>
          </Field>
        </div>
      </div>
    );
  }

  if (block.type === "markdown") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Content (Markdown)" htmlFor={`${uid}-content`}>
          <Textarea
            id={`${uid}-content`}
            rows={6}
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>
    );
  }

  if (block.type === "weather") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Location" htmlFor={`${uid}-loc`}>
          <Input
            id={`${uid}-loc`}
            placeholder="City name or lat,lon"
            value={block.location}
            onChange={(e) => onChange({ ...block, location: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit" htmlFor={`${uid}-unit`}>
            <select
              id={`${uid}-unit`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.unit ?? "celsius"}
              onChange={(e) => onChange({ ...block, unit: e.target.value as typeof block.unit })}
            >
              <option value="celsius">Celsius</option>
              <option value="fahrenheit">Fahrenheit</option>
            </select>
          </Field>
          <Field label="Display" htmlFor={`${uid}-display`}>
            <select
              id={`${uid}-display`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.display ?? "current"}
              onChange={(e) => onChange({ ...block, display: e.target.value as typeof block.display })}
            >
              <option value="current">Current</option>
              <option value="forecast-3">3-day forecast</option>
              <option value="forecast-5">5-day forecast</option>
            </select>
          </Field>
        </div>
      </div>
    );
  }

  if (block.type === "writing-lines") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Label" htmlFor={`${uid}-label`}>
          <Input
            id={`${uid}-label`}
            placeholder="Optional label"
            value={block.label ?? ""}
            onChange={(e) => onChange({ ...block, label: e.target.value || undefined })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lines" htmlFor={`${uid}-lines`}>
            <Input
              id={`${uid}-lines`}
              type="number"
              min={1}
              placeholder="Auto"
              value={block.lines ?? ""}
              onChange={(e) => onChange({ ...block, lines: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
          <Field label="Line spacing (mm)" htmlFor={`${uid}-spacing`}>
            <Input
              id={`${uid}-spacing`}
              type="number"
              min={4}
              max={20}
              value={block.line_spacing_mm ?? 8}
              onChange={(e) => onChange({ ...block, line_spacing_mm: Number(e.target.value) })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.show_margin ?? false}
            onChange={(e) => onChange({ ...block, show_margin: e.target.checked })}
            className="h-4 w-4"
          />
          Show left margin line
        </label>
      </div>
    );
  }

  if (block.type === "calendar-week") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Start date" htmlFor={`${uid}-start`}>
          <Input
            id={`${uid}-start`}
            type="date"
            value={block.start_date}
            onChange={(e) => onChange({ ...block, start_date: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Week starts" htmlFor={`${uid}-wstart`}>
            <select
              id={`${uid}-wstart`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.week_start ?? "monday"}
              onChange={(e) => onChange({ ...block, week_start: e.target.value as typeof block.week_start })}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </Field>
          <Field label="Slot height (mm)" htmlFor={`${uid}-slot`}>
            <Input
              id={`${uid}-slot`}
              type="number"
              min={3}
              max={20}
              value={block.slot_height_mm ?? 6}
              onChange={(e) => onChange({ ...block, slot_height_mm: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours from" htmlFor={`${uid}-hfrom`}>
            <Input
              id={`${uid}-hfrom`}
              type="number"
              min={0}
              max={23}
              value={block.hours?.[0] ?? 8}
              onChange={(e) => onChange({ ...block, hours: [Number(e.target.value), block.hours?.[1] ?? 20] })}
            />
          </Field>
          <Field label="Hours to" htmlFor={`${uid}-hto`}>
            <Input
              id={`${uid}-hto`}
              type="number"
              min={1}
              max={24}
              value={block.hours?.[1] ?? 20}
              onChange={(e) => onChange({ ...block, hours: [block.hours?.[0] ?? 8, Number(e.target.value)] })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.use_global_entries ?? true}
            onChange={(e) => onChange({ ...block, use_global_entries: e.target.checked })}
            className="h-4 w-4"
          />
          Use global calendar entries
        </label>
      </div>
    );
  }

  if (block.type === "calendar-day") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Date" htmlFor={`${uid}-date`}>
          <Input
            id={`${uid}-date`}
            type="date"
            value={block.date}
            onChange={(e) => onChange({ ...block, date: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours from" htmlFor={`${uid}-hfrom`}>
            <Input
              id={`${uid}-hfrom`}
              type="number"
              min={0}
              max={23}
              value={block.hours?.[0] ?? 7}
              onChange={(e) => onChange({ ...block, hours: [Number(e.target.value), block.hours?.[1] ?? 21] })}
            />
          </Field>
          <Field label="Hours to" htmlFor={`${uid}-hto`}>
            <Input
              id={`${uid}-hto`}
              type="number"
              min={1}
              max={24}
              value={block.hours?.[1] ?? 21}
              onChange={(e) => onChange({ ...block, hours: [block.hours?.[0] ?? 7, Number(e.target.value)] })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Slot height (mm)" htmlFor={`${uid}-slot`}>
            <Input
              id={`${uid}-slot`}
              type="number"
              min={3}
              max={20}
              value={block.slot_height_mm ?? 5}
              onChange={(e) => onChange({ ...block, slot_height_mm: Number(e.target.value) })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.show_lines ?? true}
            onChange={(e) => onChange({ ...block, show_lines: e.target.checked })}
            className="h-4 w-4"
          />
          Show time slot lines
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.use_global_entries ?? true}
            onChange={(e) => onChange({ ...block, use_global_entries: e.target.checked })}
            className="h-4 w-4"
          />
          Use global calendar entries
        </label>
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Style" htmlFor={`${uid}-style`}>
            <select
              id={`${uid}-style`}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={block.style ?? "solid"}
              onChange={(e) => onChange({ ...block, style: e.target.value as typeof block.style })}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="double">Double</option>
              <option value="decorative">Decorative</option>
            </select>
          </Field>
          <Field label="Margin (mm)" htmlFor={`${uid}-margin`}>
            <Input
              id={`${uid}-margin`}
              type="number"
              min={0}
              max={20}
              value={block.margin_mm ?? 2}
              onChange={(e) => onChange({ ...block, margin_mm: Number(e.target.value) })}
            />
          </Field>
        </div>
      </div>
    );
  }

  if (block.type === "spacer") {
    return (
      <div className="space-y-3 rounded-b-md border border-t-0 bg-muted/30 p-3">
        <Field label="Height (mm)" htmlFor={`${uid}-height`}>
          <Input
            id={`${uid}-height`}
            type="number"
            min={1}
            max={100}
            value={block.height_mm ?? 10}
            onChange={(e) => onChange({ ...block, height_mm: Number(e.target.value) })}
          />
        </Field>
      </div>
    );
  }

  return null;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
