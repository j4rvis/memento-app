import type { LucideIcon } from "lucide-react";

export interface EditionBlock {
  type: string;
  title: string;
  config: Record<string, unknown>;
  data: unknown;
  page_index?: number;
}

export interface FeedOption {
  id: string;
  title: string;
}

export interface ArticleOption {
  id: string;
  title: string;
}

export interface WidgetPreviewProps {
  block: EditionBlock;
}

export interface WidgetConfigProps {
  config?: Record<string, unknown>;
  feeds?: FeedOption[];
  articles?: ArticleOption[];
}

export interface WidgetThumbnailProps {
  title: string;
  config: Record<string, unknown>;
}

export type GridSize = { colSpan: 1 | 2; rowSpan: 1 | 2 | 3 | 4 };

export interface WidgetDefinition {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  supportedSizes: GridSize[];
  defaultSize: GridSize;
  configComponent: React.ComponentType<WidgetConfigProps>;
  previewComponent: React.ComponentType<WidgetPreviewProps>;
  thumbnailComponent: React.ComponentType<WidgetThumbnailProps>;
}
