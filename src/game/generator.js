// Level generator for KSEB CONNECT — Zip-style checkpoint model.
//
// CRITICAL DESIGN POINT: this generator does NOT walk a random Hamiltonian
// path first and then read checkpoint positions off of it. That approach
// makes the puzzle trivially "shaped around" a pre-existing answer instead
// of producing real constraints. Instead, the pipeline is:
//
//   1. place numbered checkpoints on the grid directly (independent of any
//      solution path)
//   2. check the exact solver's solution count on the open grid
//   3. if it's not unique, incrementally add wall edges ("carve"),
//      keeping only the ones that don't destroy solvability, re-solving
//      after each one, until the solver reports exactly one solution
//   4. if a placement can't be carved down to uniqueness within the
//      attempt budget, discard it and try a different checkpoint placement
//      from scratch
//
// The solver is the only authority on whether a candidate is valid at any
// point in this process.

import { edgeKey } from "./pathUtils.js";
import { solvePuzzle } from "./solver.js";
import { scoreDifficulty } from "./difficulty.js";

// Deterministic, seedable PRNG (mulberry32) so level generation is
// reproducible during development.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Places `count` checkpoints directly on the grid: farthest-point sampling
// for a reasonable spread (so checkpoints aren't clumped in one corner),
// then a random shuffle decides which spread-out cell gets which number.
// This is genuinely independent of any solution path.
function placeCheckpoints(size, count, rng) {
  const allCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) allCells.push([r, c]);
  }
  const shuffled = shuffle(allCells, rng);

  const chosen = [shuffled[0]];
  const isChosen = (cell) => chosen.some((ch) => ch[0] === cell[0] && ch[1] === cell[1]);

  while (chosen.length < count && chosen.length < allCells.length) {
    let best = null;
    let bestDist = -1;
    for (const cell of shuffled) {
      if (isChosen(cell)) continue;
      const minDist = Math.min(
        ...chosen.map((ch) => Math.abs(ch[0] - cell[0]) + Math.abs(ch[1] - cell[1]))
      );
      if (minDist > bestDist) {
        bestDist = minDist;
        best = cell;
      }
    }
    if (!best) break;
    chosen.push(best);
  }

  const numberedOrder = shuffle(chosen, rng);
  return numberedOrder.map(([row, col], i) => ({ number: i + 1, row, col }));
}

// Proposes one not-yet-used internal edge as a wall candidate. Only
// "right" and "down" directions are generated (each internal edge has a
// unique canonical (row,col,"right"|"down") representation this way, so we
// never accidentally propose the same edge twice from opposite sides).
function proposeWallCandidate(size, wallEdgeSet, rng, triesLeft = 60) {
  for (let i = 0; i < triesLeft; i++) {
    const row = Math.floor(rng() * size);
    const col = Math.floor(rng() * size);
    const direction = rng() < 0.5 ? "right" : "down";
    const nr = direction === "down" ? row + 1 : row;
    const nc = direction === "right" ? col + 1 : col;
    if (nr >= size || nc >= size) continue;
    const key = edgeKey(row, col, nr, nc);
    if (wallEdgeSet.has(key)) continue;
    return { row, col, direction, key };
  }
  return null;
}

/**
 * Attempts to generate one verified, uniquely-solvable level.
 * @param {object} config {id, size, checkpointCount, seed, maxPlacementAttempts, maxCarveAttempts}
 * @returns level object, or null if generation failed within the budget.
 */
export function generateLevel(config) {
  const {
    id,
    size,
    checkpointCount,
    seed = id * 7919 + 13,
    maxPlacementAttempts = 40,
    maxCarveAttempts = 500,
    solverNodeLimit = 4_000_000,
  } = config;

  const rng = makeRng(seed);

  for (let placementAttempt = 0; placementAttempt < maxPlacementAttempts; placementAttempt++) {
    const checkpoints = placeCheckpoints(size, checkpointCount, rng);

    let walls = [];
    let wallEdgeSet = new Set();
    let result = solvePuzzle({ size, checkpoints, walls }, { maxSolutions: 2, nodeLimit: solverNodeLimit });

    if (!result.solvable || result.aborted) {
      continue; // this placement has zero solutions even fully open -> try a new placement
    }

    let carveAttempts = 0;
    while (result.solutionCount !== 1 && carveAttempts < maxCarveAttempts) {
      carveAttempts++;
      const candidate = proposeWallCandidate(size, wallEdgeSet, rng);
      if (!candidate) break; // exhausted plausible edges for this placement

      const trialWalls = [...walls, { row: candidate.row, col: candidate.col, direction: candidate.direction }];
      const trialResult = solvePuzzle(
        { size, checkpoints, walls: trialWalls },
        { maxSolutions: 2, nodeLimit: solverNodeLimit }
      );

      // Only keep the wall if the puzzle is still solvable with it in place.
      // A wall that destroys solvability (0 solutions) or times out is
      // rejected and we try a different candidate edge next iteration.
      if (trialResult.solvable && !trialResult.aborted) {
        walls = trialWalls;
        wallEdgeSet.add(candidate.key);
        result = trialResult;
      }
    }

    if (result.solutionCount === 1) {
      return finalizeLevel({ id, size, checkpoints, walls, result });
    }
    // Otherwise this placement couldn't be carved down to a unique
    // solution within budget — discard it entirely and try a fresh one.
  }

  return null;
}

function finalizeLevel({ id, size, checkpoints, walls, result }) {
  const difficulty = scoreDifficulty({
    size,
    checkpointCount: checkpoints.length,
    wallCount: walls.length,
    solverResult: result,
  });
  return {
    id,
    size,
    checkpoints,
    walls,
    solution: result.firstSolution,
    difficulty: difficulty.stars,
    difficultyRaw: difficulty.raw,
  };
}

/**
 * Generates a full ordered level set from a list of per-level configs.
 * Skips (logs) any level that fails to generate after its attempt budget.
 */
export function generateLevelSet(configs) {
  const levels = [];
  const failures = [];
  for (const config of configs) {
    const level = generateLevel(config);
    if (level) {
      levels.push(level);
    } else {
      failures.push(config.id);
    }
  }
  return { levels, failures };
}
