export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CalendarEntry {
  id?: string;
  title: string;
  description?: string;
  start_at: string; // ISO 8601 datetime or ISO date for all-day
  end_at: string;   // ISO 8601 datetime or ISO date for all-day
  all_day: boolean;
  color?: string;   // hex e.g. '#4285F4'
  calendar?: string;
}

export interface MarkdownBlock {
  type: 'markdown';
  content: string;
  flex?: number;
}

export interface TitleBlock {
  type: 'title';
  text: string;
  subtitle?: string;
  date_format?: string;
  style?: 'newspaper' | 'minimal' | 'bold';
  border?: 'top' | 'bottom' | 'both' | 'none';
}

export interface WeatherCondition {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

export interface WeatherForecastDay {
  date: string;
  weathercode: number;
  temp_max: number;
  temp_min: number;
}

export interface WeatherData {
  location: string;
  unit: 'celsius' | 'fahrenheit';
  current: WeatherCondition;
  forecast: WeatherForecastDay[];
}

export interface WeatherBlock {
  type: 'weather';
  location: string;
  unit?: 'celsius' | 'fahrenheit';
  display?: 'current' | 'forecast-3' | 'forecast-5';
  data?: WeatherData; // pre-fetched and injected by caller
}

export interface WritingLinesBlock {
  type: 'writing-lines';
  label?: string;
  lines?: number;
  line_spacing_mm?: number;
  show_margin?: boolean;
}

export interface CalendarWeekBlock {
  type: 'calendar-week';
  start_date: string;
  week_start?: 'monday' | 'sunday';
  hours?: [number, number];
  show_week_number?: boolean;
  slot_height_mm?: number;
  use_global_entries?: boolean;
  entries?: CalendarEntry[];
}

export interface CalendarDayBlock {
  type: 'calendar-day';
  date: string;
  hours?: [number, number];
  slot_height_mm?: number;
  show_lines?: boolean;
  use_global_entries?: boolean;
  entries?: CalendarEntry[];
}

export interface DividerBlock {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'double' | 'decorative';
  margin_mm?: number;
}

export interface SpacerBlock {
  type: 'spacer';
  height_mm?: number;
}

export type Block =
  | MarkdownBlock
  | TitleBlock
  | WeatherBlock
  | WritingLinesBlock
  | CalendarWeekBlock
  | CalendarDayBlock
  | DividerBlock
  | SpacerBlock;

export interface Page {
  layout: 'single' | 'two-column' | 'three-column';
  blocks?: Block[];       // used when layout === 'single'
  columns?: Block[][];    // used when layout === 'two-column' | 'three-column'
  column_gap?: number;    // mm between columns, default: 5
}

export interface NewspaperConfig {
  title: string;
  date?: string;
  paper_size?: 'A4' | 'Letter' | 'A5';
  orientation?: 'portrait' | 'landscape';
  theme?: 'classic' | 'broadsheet' | 'vintage' | 'elegant' | 'bold';
  font_family?: string;
  base_font_size?: number;
  margins?: Margins;
  calendar_entries?: CalendarEntry[];
  pages: Page[];
}
