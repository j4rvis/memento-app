"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CalendarEntry } from "@/modules/newspaper/lib/types";

const COLORS = [
  "#4285F4", "#EA4335", "#FBBC05", "#34A853",
  "#FF6D00", "#9C27B0", "#00BCD4", "#607D8B",
];

interface Props {
  entries: CalendarEntry[];
  onChange: (entries: CalendarEntry[]) => void;
}

const EMPTY_ENTRY: Omit<CalendarEntry, "id"> = {
  title: "",
  description: "",
  start_at: new Date().toISOString().slice(0, 16),
  end_at: new Date().toISOString().slice(0, 16),
  all_day: false,
  color: "#4285F4",
  calendar: "",
};

export function CalendarEntryManager({ entries, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Omit<CalendarEntry, "id">>(EMPTY_ENTRY);
  const [formOpen, setFormOpen] = useState(false);

  function openNew() {
    setEditingIndex(null);
    setDraft({ ...EMPTY_ENTRY });
    setFormOpen(true);
  }

  function openEdit(index: number) {
    setEditingIndex(index);
    const { id: _, ...rest } = entries[index];
    setDraft({ ...EMPTY_ENTRY, ...rest });
    setFormOpen(true);
  }

  function handleSave() {
    if (!draft.title.trim()) return;
    const entry: CalendarEntry = {
      id: editingIndex !== null ? entries[editingIndex].id : crypto.randomUUID(),
      ...draft,
    };
    if (editingIndex !== null) {
      const updated = entries.map((e, i) => (i === editingIndex ? entry : e));
      onChange(updated);
    } else {
      onChange([...entries, entry]);
    }
    setFormOpen(false);
  }

  function handleDelete(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar Entries
          {entries.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {entries.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Calendar Entries</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No entries yet. Add one to populate calendar blocks.
            </p>
          )}
          {entries.map((entry, i) => (
            <div key={entry.id ?? i} className="flex items-start gap-2 rounded-md border p-3">
              <div
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                style={{ background: entry.color ?? "#4285F4" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.all_day
                    ? `${entry.start_at.slice(0, 10)} (all day)`
                    : `${formatDt(entry.start_at)} – ${formatDt(entry.end_at)}`}
                </p>
                {entry.calendar && (
                  <p className="text-xs text-muted-foreground">{entry.calendar}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(i)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          {formOpen ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                {editingIndex !== null ? "Edit entry" : "New entry"}
              </p>
              <Field label="Title">
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Event title"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value || undefined })}
                  placeholder="Optional description"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.all_day}
                  onChange={(e) => setDraft({ ...draft, all_day: e.target.checked })}
                  className="h-4 w-4"
                />
                All day event
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <Input
                    type={draft.all_day ? "date" : "datetime-local"}
                    value={draft.all_day ? draft.start_at.slice(0, 10) : draft.start_at.slice(0, 16)}
                    onChange={(e) =>
                      setDraft({ ...draft, start_at: draft.all_day ? e.target.value : e.target.value })
                    }
                  />
                </Field>
                <Field label="End">
                  <Input
                    type={draft.all_day ? "date" : "datetime-local"}
                    value={draft.all_day ? draft.end_at.slice(0, 10) : draft.end_at.slice(0, 16)}
                    onChange={(e) =>
                      setDraft({ ...draft, end_at: draft.all_day ? e.target.value : e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Calendar label">
                <Input
                  value={draft.calendar ?? ""}
                  onChange={(e) => setDraft({ ...draft, calendar: e.target.value || undefined })}
                  placeholder="e.g. Work, Personal"
                />
              </Field>
              <Field label="Color">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${draft.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                      onClick={() => setDraft({ ...draft, color: c })}
                    />
                  ))}
                </div>
              </Field>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={!draft.title.trim()}>
                  Save entry
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={openNew} size="sm" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add entry
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
