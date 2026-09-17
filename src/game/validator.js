import {
  cellKey,
  canMove,
  buildWallSet,
  prepareBoard,
} from "./pathUtils.js";

// --- Level data integrity -------------------------------------------------

export function validateLevelData(level) {
  const errors = [];
  const { size, checkpoints = [], walls = [] } = level;

  if (!Number.isInteger(size) || size < 3) {
    errors.push("size must be an integer >= 3");
  }

  const inRange = (row, col) =>
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < size &&
    col >= 0 &&
    col < size;

  if (checkpoints.length === 0) {
    errors.push("level must contain at least checkpoint 1 (KSEB)");
  }

  const sorted = [...checkpoints].sort((a, b) => a.number - b.number);
  if (sorted.length > 0 && sorted[0].number !== 1) {
    errors.push("checkpoint numbering must start at 1 (KSEB)");
  }
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].number !== i + 1) {
      errors.push(`checkpoint numbers must be sequential with no gaps (found ${sorted[i].number} at position ${i + 1})`);
      break;
    }
  }

  const seenPositions = new Set();
  checkpoints.forEach((cp, i) => {
    if (!inRange(cp.row, cp.col)) {
      errors.push(`checkpoint[${i}] (number ${cp.number}) out of bounds`);
      return;
    }
    const k = cellKey(cp.row, cp.col);
    if (seenPositions.has(k)) errors.push(`duplicate checkpoint position at ${k}`);
    seenPositions.add(k);
  });

  const validDirections = new Set(["up", "down", "left", "right"]);
  walls.forEach((w, i) => {
    if (!inRange(w.row, w.col)) {
      errors.push(`wall[${i}] cell out of bounds`);
      return;
    }
    if (!validDirections.has(w.direction)) {
      errors.push(`wall[${i}] has invalid direction "${w.direction}"`);
      return;
    }
    const deltas = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    const [dr, dc] = deltas[w.direction];
    const nr = w.row + dr;
    const nc = w.col + dc;
    if (!inRange(nr, nc)) {
      errors.push(`wall[${i}] references a neighbor outside the board`);
    }
  });

  // Connectivity: every cell must be reachable from checkpoint 1 when
  // walls are respected (otherwise full coverage is impossible outright).
  if (errors.length === 0) {
    const wallSet = buildWallSet(walls, size);
    const start = sorted[0];
    const seen = new Set([cellKey(start.row, start.col)]);
    const stack = [[start.row, start.col]];
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        const k = cellKey(nr, nc);
        if (canMove(r, c, nr, nc, size, wallSet) && !seen.has(k)) {
          seen.add(k);
          stack.push([nr, nc]);
        }
      }
    }
    if (seen.size !== size * size) {
      errors.push("board is not fully connected from checkpoint 1 under the given walls");
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Live move validation --------------------------------------------------

// Given the path so far, what checkpoint number must be entered next
// (undefined once every checkpoint has been visited)?
function nextRequiredCheckpointNumber(board, currentPath) {
  const prepared = prepareBoard(board);
  const { checkpointMap, checkpoints } = prepared;
  let count = 0;
  for (const [r, c] of currentPath) {
    if (checkpointMap.has(cellKey(r, c))) count++;
  }
  return count < checkpoints.length ? checkpoints[count].number : undefined;
}

/**
 * Determines whether appending `next` to `currentPath` is a legal move.
 * Returns one of: "invalid-not-start", "invalid-wall", "invalid-not-adjacent",
 * "invalid-visited", "invalid-checkpoint-order", "invalid-final-too-early",
 * "backtrack", "advance"
 */
export function evaluateMove(board, currentPath, next) {
  const { size, walls = [], checkpoints } = board;
  const wallSet = buildWallSet(walls, size);
  const checkpointMap = new Map(checkpoints.map((cp) => [cellKey(cp.row, cp.col), cp.number]));
  const totalCells = size * size;
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.number - b.number);
  const finalCheckpoint = sortedCheckpoints[sortedCheckpoints.length - 1];

  if (currentPath.length === 0) {
    const start = checkpoints.find((cp) => cp.number === 1);
    const isStart = start && next.row === start.row && next.col === start.col;
    return isStart ? "advance" : "invalid-not-start";
  }

  const last = currentPath[currentPath.length - 1];

  // Backtrack: stepping onto the immediately previous cell removes the tip.
  if (currentPath.length >= 2) {
    const prev = currentPath[currentPath.length - 2];
    if (prev[0] === next.row && prev[1] === next.col) {
      return "backtrack";
    }
  }

  if (!canMove(last[0], last[1], next.row, next.col, size, wallSet)) {
    const dr = Math.abs(last[0] - next.row);
    const dc = Math.abs(last[1] - next.col);
    const isAdjacentIgnoringWalls = dr + dc === 1;
    return isAdjacentIgnoringWalls ? "invalid-wall" : "invalid-not-adjacent";
  }

  const alreadyVisited = currentPath.some(
    ([r, c]) => r === next.row && c === next.col
  );
  if (alreadyVisited) return "invalid-visited";

  // Checkpoint-order enforcement: a future checkpoint cannot be entered
  // before its turn (Test 2 in the acceptance checklist).
  const checkpointNumberHere = checkpointMap.get(cellKey(next.row, next.col));
  if (checkpointNumberHere !== undefined) {
    const required = nextRequiredCheckpointNumber(board, currentPath);
    if (checkpointNumberHere !== required) {
      return "invalid-checkpoint-order";
    }

    // The final checkpoint must be the LAST cell of the whole path. Stepping
    // onto it while other cells remain unvisited is rejected outright,
    // rather than silently accepted and only failing completion later — the
    // player gets immediate feedback that they need to route through the
    // remaining cells first, and the resulting path is never allowed to
    // move on from that final node (mirroring "no cell after the final
    // home" in the design: the move itself never happens).
    const isFinalCheckpoint =
      finalCheckpoint &&
      next.row === finalCheckpoint.row &&
      next.col === finalCheckpoint.col;
    if (isFinalCheckpoint && currentPath.length + 1 !== totalCells) {
      return "invalid-final-too-early";
    }
  }

  return "advance";
}

/**
 * Checks whether the given path is a fully valid, complete solution to the
 * board. This is the single source of truth the UI must call before
 * declaring a win — GameBoard/App never re-derive completion any other way.
 *
 * Full coverage of every cell is necessary but NOT sufficient: the path
 * must also *terminate* at the final (highest-numbered) checkpoint. Because
 * evaluateMove already rejects out-of-order checkpoint entry, and now also
 * rejects entering the final checkpoint before every other cell is visited
 * (see "invalid-final-too-early" below), a path built entirely through
 * evaluateMove can never violate this. This function re-verifies everything
 * from scratch anyway, independent of the live interaction code, as a
 * defensive second check — so it is never possible for the UI and the
 * solver to disagree about what "solved" means.
 */
export function isLevelComplete(board, path) {
  if (!path || path.length === 0) return false;

  const prepared = prepareBoard(board);
  const { size, wallSet, checkpointMap, totalCells, checkpoints } = prepared;

  if (checkpoints.length === 0) return false;
  if (path[0][0] !== checkpoints[0].row || path[0][1] !== checkpoints[0].col) return false;
  if (path.length !== totalCells) return false;

  // The final cell of the path must be the final checkpoint. Full coverage
  // that ends anywhere else is an incomplete/invalid solution, not a win.
  const finalCheckpoint = checkpoints[checkpoints.length - 1];
  const last = path[path.length - 1];
  if (last[0] !== finalCheckpoint.row || last[1] !== finalCheckpoint.col) return false;

  const orderedNumbers = checkpoints.map((c) => c.number);
  let nextIdx = 0;
  const seen = new Set();

  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    const k = cellKey(r, c);
    if (seen.has(k)) return false;
    seen.add(k);
    if (i > 0) {
      const [pr, pc] = path[i - 1];
      if (!canMove(pr, pc, r, c, size, wallSet)) return false;
    }
    if (checkpointMap.has(k)) {
      const number = checkpointMap.get(k);
      if (number !== orderedNumbers[nextIdx]) return false;
      nextIdx++;
    }
  }

  return nextIdx === orderedNumbers.length;
}

export function reachedCheckpointNumbers(board, path) {
  const visited = new Set(path.map(([r, c]) => cellKey(r, c)));
  return board.checkpoints
    .filter((cp) => visited.has(cellKey(cp.row, cp.col)))
    .map((cp) => cp.number);
}
