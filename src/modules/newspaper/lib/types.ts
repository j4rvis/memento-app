export type PaperFormat = 'A4' | 'A5'
export type FillDirection = 'column' | 'row'

export interface LayoutConfig {
  format: PaperFormat
  fill_direction: FillDirection
}

export interface GridPosition {
  grid_col: number
  grid_row: number
  col_span: number
  row_span: number
}

export const GRID_DIMENSIONS: Record<PaperFormat, { cols: number; rows: number }> = {
  A4: { cols: 2, rows: 4 },
  A5: { cols: 2, rows: 2 },
}
