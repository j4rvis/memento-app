import { FileText } from "lucide-react";
import { NotesConfig } from "./config";
import { NotesPreview } from "./preview";
import { NotesThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const NotesWidgetDef: WidgetDefinition = {
  type: "notes",
  label: "Notes",
  description: "Latest or pinned notes",
  icon: FileText,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: NotesConfig,
  previewComponent: NotesPreview,
  thumbnailComponent: NotesThumbnail,
};
