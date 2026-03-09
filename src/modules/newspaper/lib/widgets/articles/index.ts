import { BookOpen } from "lucide-react";
import { ArticlesConfig } from "./config";
import { ArticlesPreview } from "./preview";
import { ArticlesThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const ArticlesWidgetDef: WidgetDefinition = {
  type: "articles",
  label: "Articles",
  description: "Saved read-later articles",
  icon: BookOpen,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 2 },
  configComponent: ArticlesConfig,
  previewComponent: ArticlesPreview,
  thumbnailComponent: ArticlesThumbnail,
};
