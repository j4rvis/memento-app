"use client";

import { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (config: NewspaperConfig) => void;
}

function validateConfig(parsed: unknown): NewspaperConfig {
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).title !== "string" ||
    !Array.isArray((parsed as Record<string, unknown>).pages)
  ) {
    throw new Error('JSON must have a "title" (string) and "pages" (array).');
  }
  return parsed as NewspaperConfig;
}

export function ImportJsonDialog({ open, onOpenChange, onImport }: Props) {
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Radix Dialog sometimes leaves overflow:hidden on body after closing.
  // Restore it explicitly when the dialog transitions to closed.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
    }
  }, [open]);

  function reset() {
    setPasteValue("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset();
    onOpenChange(value);
  }

  function applyJson(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      const config = validateConfig(parsed);
      onImport(config);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => applyJson(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handlePasteImport() {
    applyJson(pasteValue);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-3xl max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Import JSON</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs defaultValue="paste" onValueChange={() => setError(null)}>
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload file</TabsTrigger>
              <TabsTrigger value="paste">Paste JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select a <code>.json</code> file exported from this editor.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1 file:text-xs"
              />
            </TabsContent>

            <TabsContent value="paste" className="space-y-3">
              <Textarea
                placeholder='{ "title": "My Newspaper", "pages": [...] }'
                value={pasteValue}
                onChange={(e) => {
                  setPasteValue(e.target.value);
                  setError(null);
                }}
                className="font-mono text-xs h-96 resize-none"
              />
              <DialogFooter>
                <Button onClick={handlePasteImport} disabled={!pasteValue.trim()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
