import { Image } from "lucide-react";
import { ImageConfig } from "./config";
import { ImagePreview } from "./preview";
import { ImageThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const ImageWidgetDef: WidgetDefinition = {
  type: "image",
  label: "Image",
  description: "A photo from Unsplash or a custom URL with an optional caption",
  icon: Image,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: ImageConfig,
  previewComponent: ImagePreview,
  thumbnailComponent: ImageThumbnail,
};
