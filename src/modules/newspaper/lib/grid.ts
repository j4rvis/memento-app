export function getBlockCells(
  gridCol: number,
  gridRow: number,
  colSpan: number,
  rowSpan: number
): Array<{ col: number; row: number }> {
  const cells: Array<{ col: number; row: number }> = [];
  for (let r = gridRow; r < gridRow + rowSpan; r++) {
    for (let c = gridCol; c < gridCol + colSpan; c++) {
      cells.push({ col: c, row: r });
    }
  }
  return cells;
}

export function checkOverlap(
  blocks: Array<{
    id?: string;
    grid_col: number | null;
    grid_row: number | null;
    col_span: number;
    row_span: number;
  }>,
  gridCol: number,
  gridRow: number,
  colSpan: number,
  rowSpan: number,
  excludeId?: string
): boolean {
  const targetCells = getBlockCells(gridCol, gridRow, colSpan, rowSpan);
  for (const block of blocks) {
    if (excludeId && block.id === excludeId) continue;
    if (block.grid_col === null || block.grid_row === null) continue;
    const blockCells = getBlockCells(
      block.grid_col,
      block.grid_row,
      block.col_span,
      block.row_span
    );
    for (const tc of targetCells) {
      for (const bc of blockCells) {
        if (tc.col === bc.col && tc.row === bc.row) return true;
      }
    }
  }
  return false;
}

export function buildCellMap(
  blocks: Array<{
    id: string;
    grid_col: number | null;
    grid_row: number | null;
    col_span: number;
    row_span: number;
  }>,
  cols: number,
  rows: number
): Map<string, "empty" | "block-start" | "spanned"> {
  const map = new Map<string, "empty" | "block-start" | "spanned">();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      map.set(`${r}-${c}`, "empty");
    }
  }

  for (const block of blocks) {
    const startCol = block.grid_col;
    const startRow = block.grid_row;
    if (startCol === null || startRow === null) continue;
    for (let r: number = startRow; r < startRow + block.row_span && r < rows; r++) {
      for (let c: number = startCol; c < startCol + block.col_span && c < cols; c++) {
        if (r === startRow && c === startCol) {
          map.set(`${r}-${c}`, "block-start");
        } else {
          map.set(`${r}-${c}`, "spanned");
        }
      }
    }
  }

  return map;
}
