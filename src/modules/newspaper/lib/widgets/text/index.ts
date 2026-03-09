import { AlignLeft } from "lucide-react";
import { TextConfig } from "./config";
import { TextPreview } from "./preview";
import { TextThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const TextWidgetDef: WidgetDefinition = {
  type: "text",
  label: "Text",
  description: "Static text or editorial content",
  icon: AlignLeft,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: TextConfig,
  previewComponent: TextPreview,
  thumbnailComponent: TextThumbnail,
};
