// Exact solver for KSEB CONNECT puzzles (Zip-style: numbered checkpoints +
// full-grid coverage + wall edges).
//
// A puzzle is solved by a single path that:
//   - starts at checkpoint 1 (KSEB)
//   - moves only up/down/left/right between cells, never crossing a wall
//   - never revisits a cell
//   - visits every cell in the grid exactly once (full coverage)
//   - reaches checkpoints 2..N in strictly ascending order along the way
//   - ENDS at the final (highest-numbered) checkpoint — reaching it is not
//     enough on its own, it must also be the very last cell of the path,
//     which means it can only be entered once every other cell has already
//     been visited. Reaching it any earlier is an illegal branch (see the
//     pruning note below), not a valid-but-unfinished path.
//
// This is solved with DFS + backtracking, pruned by:
//   - connectivity: after each move, the remaining unvisited region must
//     still be one connected blob reachable from the current cell (walls
//     count as removed edges when computing this)
//   - checkpoint reachability: every not-yet-visited checkpoint must lie
//     inside that reachable blob
//   - checkpoint order: stepping onto a checkpoint cell out of sequence is
//     an illegal branch, pruned immediately rather than discovered later
//   - final-checkpoint timing: stepping onto the FINAL checkpoint while any
//     other cell remains unvisited is an illegal branch, pruned immediately
//     for the same reason — this is what guarantees every solution the
//     solver reports has the final checkpoint as its last cell

import {
  DIRECTIONS,
  cellKey,
  canMove,
  floodFillReachable,
  prepareBoard,
} from "./pathUtils.js";

/**
 * @param {object} board {size, checkpoints, walls}
 * @param {object} options
 *   maxSolutions: stop after finding this many solutions (default 2, for uniqueness checks)
 *   nodeLimit: abort (mark as unknown) after exploring this many DFS nodes
 * @returns {{
 *   solvable: boolean,
 *   solutionCount: number,
 *   firstSolution: number[][] | null,
 *   nodesExplored: number,
 *   aborted: boolean,
 *   maxBranchingFactor: number,
 *   totalBranches: number,
 *   branchPoints: number,
 * }}
 */
export function solvePuzzle(board, options = {}) {
  const { maxSolutions = 2, nodeLimit = 3_000_000 } = options;

  const prepared = prepareBoard(board);
  const { size, wallSet, checkpointMap, totalCells, checkpoints } = prepared;

  if (checkpoints.length === 0 || checkpoints[0].number !== 1) {
    return emptyResult();
  }
  const start = checkpoints[0];
  const orderedCheckpointNumbers = checkpoints.map((c) => c.number);

  const visited = new Set();
  const path = [];
  let solutionCount = 0;
  let firstSolution = null;
  let nodesExplored = 0;
  let aborted = false;
  let maxBranchingFactor = 0;
  let totalBranches = 0;
  let branchPoints = 0;

  function remainingCheckpointsReachable(seen, nextIdx) {
    for (let i = nextIdx; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const key = cellKey(cp.row, cp.col);
      if (!visited.has(key) && !seen.has(key)) return false;
    }
    return true;
  }

  function dfs(row, col, remainingUnvisited, nextCheckpointIdx) {
    if (aborted) return;
    nodesExplored++;
    if (nodesExplored > nodeLimit) {
      aborted = true;
      return;
    }

    if (remainingUnvisited === 0) {
      if (nextCheckpointIdx === orderedCheckpointNumbers.length) {
        solutionCount++;
        if (!firstSolution) firstSolution = path.slice();
      }
      return;
    }

    const seen = floodFillReachable(row, col, size, wallSet, visited);
    if (seen.size !== remainingUnvisited) return; // isolated pocket -> dead end
    if (!remainingCheckpointsReachable(seen, nextCheckpointIdx)) return;

    const candidates = [];
    for (const [dr, dc] of DIRECTIONS) {
      const nr = row + dr;
      const nc = col + dc;
      const k = cellKey(nr, nc);
      if (canMove(row, col, nr, nc, size, wallSet) && !visited.has(k)) {
        candidates.push([nr, nc]);
      }
    }

    if (candidates.length > 1) {
      branchPoints++;
      totalBranches += candidates.length;
      if (candidates.length > maxBranchingFactor) {
        maxBranchingFactor = candidates.length;
      }
    }

    for (const [nr, nc] of candidates) {
      const k = cellKey(nr, nc);

      // Checkpoint-order pruning: stepping onto a checkpoint must be the
      // next required one in sequence, or this branch is illegal.
      let advancedIdx = nextCheckpointIdx;
      const checkpointNumberHere = checkpointMap.get(k);
      if (checkpointNumberHere !== undefined) {
        if (checkpointNumberHere !== orderedCheckpointNumbers[nextCheckpointIdx]) {
          continue;
        }
        advancedIdx = nextCheckpointIdx + 1;

        // Final-checkpoint pruning: the last checkpoint in sequence is only
        // a legal step when it's ALSO the last cell of the path. Stepping
        // onto it while cells remain unvisited would strand those cells
        // behind a node the rules forbid moving on from, so treat it as a
        // dead branch here rather than discovering it later at the leaf.
        const isFinalCheckpoint = advancedIdx === orderedCheckpointNumbers.length;
        if (isFinalCheckpoint && remainingUnvisited - 1 !== 0) {
          continue;
        }
      }

      visited.add(k);
      path.push([nr, nc]);
      dfs(nr, nc, remainingUnvisited - 1, advancedIdx);
      path.pop();
      visited.delete(k);
      if (aborted || solutionCount >= maxSolutions) return;
    }
  }

  visited.add(cellKey(start.row, start.col));
  path.push([start.row, start.col]);
  dfs(start.row, start.col, totalCells - 1, 1);

  return {
    solvable: solutionCount > 0,
    solutionCount,
    firstSolution,
    nodesExplored,
    aborted,
    maxBranchingFactor,
    totalBranches,
    branchPoints,
  };
}

function emptyResult() {
  return {
    solvable: false,
    solutionCount: 0,
    firstSolution: null,
    nodesExplored: 0,
    aborted: false,
    maxBranchingFactor: 0,
    totalBranches: 0,
    branchPoints: 0,
  };
}

// Convenience: verify a path against a board exactly, independent of the
// DFS above. Used by tests and by dev-time level verification as a second,
// differently-written check on the same rules.
export function isPathAFullSolution(board, path) {
  const prepared = prepareBoard(board);
  const { size, wallSet, checkpointMap, totalCells, checkpoints } = prepared;

  if (!path || path.length !== totalCells) return false;
  if (checkpoints.length === 0) return false;
  if (path[0][0] !== checkpoints[0].row || path[0][1] !== checkpoints[0].col) return false;

  const orderedNumbers = checkpoints.map((c) => c.number);
  const finalCheckpoint = checkpoints[checkpoints.length - 1];
  // The path's final cell must be the final checkpoint — reaching it
  // anywhere else in the path is not a solution, even with full coverage.
  const last = path[path.length - 1];
  if (last[0] !== finalCheckpoint.row || last[1] !== finalCheckpoint.col) return false;

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
