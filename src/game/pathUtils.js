// Shared low-level grid utilities for the checkpoint + wall puzzle model.
//
// A "board" is: { size, checkpoints:[{number,row,col}], walls:[{row,col,direction}] }
// A "path" is an ordered array of [row, col] pairs.
//
// IMPORTANT: every cell in the size x size grid is usable. There is no
// concept of a "blocked cell" anymore. Obstruction is expressed purely as
// a wall on the EDGE between two adjacent cells, which still lets both
// cells be visited, just not directly from one to the other.

export const DIRECTIONS = [
  [-1, 0], // up
  [1, 0], // down
  [0, -1], // left
  [0, 1], // right
];

// Maps a named wall direction to its row/col delta, and back.
export const DIRECTION_VECTORS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

const OPPOSITE_DIRECTION = { up: "down", down: "up", left: "right", right: "left" };

export function cellKey(row, col) {
  return `${row},${col}`;
}

export function isAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

export function inBounds(row, col, size) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

// Canonical key for the edge between two cells, independent of which one
// is "from" and which is "to" — this is what makes wall checks symmetrical:
// a wall blocks movement in BOTH directions across it.
export function edgeKey(r1, c1, r2, c2) {
  const a = cellKey(r1, c1);
  const b = cellKey(r2, c2);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Builds a Set of canonical edge keys from a level's wall list. Each wall
// entry names one cell + one direction; we resolve it to the actual pair
// of adjacent cells it sits between so lookups don't care which side of
// the wall you're asking from.
export function buildWallSet(walls = [], size) {
  const set = new Set();
  for (const wall of walls) {
    const [dr, dc] = DIRECTION_VECTORS[wall.direction] || [];
    if (dr === undefined) continue;
    const nr = wall.row + dr;
    const nc = wall.col + dc;
    if (!inBounds(wall.row, wall.col, size) || !inBounds(nr, nc, size)) continue;
    set.add(edgeKey(wall.row, wall.col, nr, nc));
  }
  return set;
}

// THE single movement-legality check. Used identically by the solver and
// by the player's live drag interaction so the two can never disagree.
export function canMove(fromRow, fromCol, toRow, toCol, size, wallSet) {
  if (!inBounds(fromRow, fromCol, size) || !inBounds(toRow, toCol, size)) return false;
  const dr = Math.abs(fromRow - toRow);
  const dc = Math.abs(fromCol - toCol);
  if (dr + dc !== 1) return false; // must be orthogonally adjacent, no diagonals
  if (wallSet.has(edgeKey(fromRow, fromCol, toRow, toCol))) return false;
  return true;
}

export function buildCheckpointMap(checkpoints = []) {
  const map = new Map();
  checkpoints.forEach((cp) => map.set(cellKey(cp.row, cp.col), cp.number));
  return map;
}

// Normalizes a board's core numbers once, reused by solver/validator/generator.
export function prepareBoard(board) {
  const { size, checkpoints, walls = [] } = board;
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.number - b.number);
  return {
    size,
    checkpoints: sortedCheckpoints,
    checkpointMap: buildCheckpointMap(sortedCheckpoints),
    wallSet: buildWallSet(walls, size),
    totalCells: size * size,
  };
}

// Flood-fill the set of not-yet-visited cells reachable from (row,col),
// respecting walls. The origin cell itself is a traversal seed only — it
// is NOT included in the returned set (it's assumed already visited), so
// the result's size is directly comparable to a "remaining cells" counter.
export function floodFillReachable(row, col, size, wallSet, visitedSet) {
  const reachable = new Set();
  const explored = new Set([cellKey(row, col)]);
  const stack = [[row, col]];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      const k = cellKey(nr, nc);
      if (
        canMove(r, c, nr, nc, size, wallSet) &&
        !visitedSet.has(k) &&
        !explored.has(k)
      ) {
        explored.add(k);
        reachable.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return reachable;
}

export function pathToKeySet(path) {
  return new Set(path.map(([r, c]) => cellKey(r, c)));
}

export function oppositeDirection(direction) {
  return OPPOSITE_DIRECTION[direction];
}
