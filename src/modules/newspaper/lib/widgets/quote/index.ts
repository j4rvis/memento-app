import { Quote } from "lucide-react";
import { QuoteConfig } from "./config";
import { QuotePreview } from "./preview";
import { QuoteThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const QuoteWidgetDef: WidgetDefinition = {
  type: "quote",
  label: "Quote",
  description: "An inspirational quote with attribution",
  icon: Quote,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 2, rowSpan: 1 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: QuoteConfig,
  previewComponent: QuotePreview,
  thumbnailComponent: QuoteThumbnail,
};
