import { Rss } from "lucide-react";
import { RssConfig } from "./config";
import { RssPreview } from "./preview";
import { RssThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const RssWidgetDef: WidgetDefinition = {
  type: "rss",
  label: "RSS Feed",
  description: "Latest entries from a feed",
  icon: Rss,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 2 },
  configComponent: RssConfig,
  previewComponent: RssPreview,
  thumbnailComponent: RssThumbnail,
};
