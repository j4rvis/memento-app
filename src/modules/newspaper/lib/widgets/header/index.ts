import { Newspaper } from "lucide-react";
import { HeaderConfig } from "./config";
import { HeaderPreview } from "./preview";
import { HeaderThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const HeaderWidgetDef: WidgetDefinition = {
  type: "header",
  label: "Masthead",
  description: "Newspaper title, date, and optional weather line",
  icon: Newspaper,
  supportedSizes: [
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 1, rowSpan: 1 },
  ],
  defaultSize: { colSpan: 2, rowSpan: 1 },
  configComponent: HeaderConfig,
  previewComponent: HeaderPreview,
  thumbnailComponent: HeaderThumbnail,
};
