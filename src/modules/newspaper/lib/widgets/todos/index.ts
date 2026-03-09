import { CheckSquare } from "lucide-react";
import { TodosConfig } from "./config";
import { TodosPreview } from "./preview";
import { TodosThumbnail } from "./thumbnail";
import type { WidgetDefinition } from "../types";

export const TodosWidgetDef: WidgetDefinition = {
  type: "todos",
  label: "Todos",
  description: "Top incomplete tasks by priority",
  icon: CheckSquare,
  supportedSizes: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ],
  defaultSize: { colSpan: 1, rowSpan: 1 },
  configComponent: TodosConfig,
  previewComponent: TodosPreview,
  thumbnailComponent: TodosThumbnail,
};
