import { Cloud } from "lucide-react";
import { WeatherConfig } from "./config";
import { WeatherPreview } from "./preview";
import { WeatherThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const WeatherWidgetDef: WidgetDefinition = {
  type: "weather",
  label: "Weather",
  description: "Current conditions and 3-day forecast",
  icon: Cloud,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: WeatherConfig,
  previewComponent: WeatherPreview,
  thumbnailComponent: WeatherThumbnail,
};
