import { TodosWidgetDef } from "./todos";
import { NotesWidgetDef } from "./notes";
import { RssWidgetDef } from "./rss";
import { ArticlesWidgetDef } from "./articles";
import { TextWidgetDef } from "./text";
import { WeatherWidgetDef } from "./weather";
import { CalendarWidgetDef } from "./calendar";
import type { WidgetDefinition } from "./types";

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  todos: TodosWidgetDef,
  notes: NotesWidgetDef,
  rss: RssWidgetDef,
  articles: ArticlesWidgetDef,
  text: TextWidgetDef,
  weather: WeatherWidgetDef,
  calendar: CalendarWidgetDef,
};

export const WIDGET_LIST = Object.values(WIDGET_REGISTRY);
