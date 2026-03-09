import { CalendarDays } from "lucide-react";
import { CalendarConfig } from "./config";
import { CalendarPreview } from "./preview";
import { CalendarThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const CalendarWidgetDef: WidgetDefinition = {
  type: "calendar",
  label: "Calendar",
  description: "Upcoming todos grouped by due date",
  icon: CalendarDays,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 2 },
  configComponent: CalendarConfig,
  previewComponent: CalendarPreview,
  thumbnailComponent: CalendarThumbnail,
};
