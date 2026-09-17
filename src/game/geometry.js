// ONE shared coordinate system for the whole board. Every visual element
// (grid cells, walls, KSEB, houses, numbers, the drawn path, completion
// effects) must derive its position from these functions and nothing else.
// The board is always rendered in a normalized 0-100 SVG viewBox regardless
// of the actual on-screen pixel size, so "cellSize" here means "units per
// cell in that 0-100 space", not screen pixels.

export const BOARD_UNITS = 100;

export function getCellSize(size) {
  return BOARD_UNITS / size;
}

// Center point of a cell, in board units.
export function getCellCenter(row, col, cellSize) {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

// Top-left + dimensions of a cell, in board units.
export function getCellRect(row, col, cellSize) {
  return {
    x: col * cellSize,
    y: row * cellSize,
    width: cellSize,
    height: cellSize,
  };
}

// The shared edge segment between (row,col) and its neighbor in `direction`,
// as a line from {x1,y1} to {x2,y2}, in board units. Used to render walls
// exactly on the boundary between two cells, never floating inside one.
export function getEdgeSegment(row, col, direction, cellSize) {
  const rect = getCellRect(row, col, cellSize);
  switch (direction) {
    case "up":
      return { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y };
    case "down":
      return {
        x1: rect.x,
        y1: rect.y + rect.height,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
      };
    case "left":
      return { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height };
    case "right":
      return {
        x1: rect.x + rect.width,
        y1: rect.y,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
      };
    default:
      throw new Error(`Unknown wall direction: ${direction}`);
  }
}
