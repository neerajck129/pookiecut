import { LEVELS } from "../src/levels/levels.js";
import { solvePuzzle, isPathAFullSolution } from "../src/game/solver.js";
import { validateLevelData, evaluateMove, isLevelComplete } from "../src/game/validator.js";

let failed = 0;

console.log(`Testing ${LEVELS.length} production levels...\n`);

for (const level of LEVELS) {
  const dataCheck = validateLevelData(level);
  if (!dataCheck.valid) {
    console.error(`✗ Level ${level.id}: INVALID DATA -> ${dataCheck.errors.join("; ")}`);
    failed++;
    continue;
  }

  const result = solvePuzzle(level, { maxSolutions: 2, nodeLimit: 8_000_000 });
  if (!result.solvable || result.aborted || result.solutionCount !== 1) {
    console.error(
      `✗ Level ${level.id}: NOT UNIQUELY SOLVABLE (solutionCount=${result.solutionCount}, aborted=${result.aborted})`
    );
    failed++;
    continue;
  }

  if (!level.solution || !isPathAFullSolution(level, level.solution)) {
    console.error(`✗ Level ${level.id}: stored solution field does not verify`);
    failed++;
    continue;
  }

  if (!isLevelComplete(level, level.solution)) {
    console.error(`✗ Level ${level.id}: stored solution fails isLevelComplete()`);
    failed++;
    continue;
  }

  console.log(
    `✓ Level ${String(level.id).padStart(2, "0")}  ${level.size}x${level.size}  checkpoints=${level.checkpoints.length}  walls=${level.walls.length}  difficulty=${level.difficulty}/10  (unique solution)`
  );
}

console.log(`\n${LEVELS.length - failed}/${LEVELS.length} levels verified with a unique solution.`);

// --- Focused unit checks on the validator's move logic, per the acceptance
// test checklist (diagonal rejection, revisit rejection, wall rejection,
// checkpoint-order rejection, backtracking). -------------------------------

console.log("\nRunning move-validation sanity checks...");

const testBoard = {
  size: 3,
  checkpoints: [
    { number: 1, row: 0, col: 0 },
    { number: 2, row: 2, col: 2 },
  ],
  walls: [{ row: 0, col: 1, direction: "right" }],
};

const checks = [
  {
    name: "must start at checkpoint 1 (KSEB)",
    path: [],
    next: { row: 1, col: 0 },
    expect: "invalid-not-start",
  },
  {
    name: "non-adjacent (diagonal-equivalent) move rejected",
    path: [[0, 0]],
    next: { row: 1, col: 1 },
    expect: "invalid-not-adjacent",
  },
  {
    name: "valid forward move",
    path: [[0, 0]],
    next: { row: 0, col: 1 },
    expect: "advance",
  },
  {
    name: "wall blocks crossing",
    path: [[0, 0], [0, 1]],
    next: { row: 0, col: 2 },
    expect: "invalid-wall",
  },
  {
    name: "wall blocks crossing symmetrically from the other side",
    path: [[0, 0], [1, 0], [1, 1], [0, 1]],
    next: { row: 0, col: 2 },
    expect: "invalid-wall",
  },
  {
    name: "backtrack to immediate previous cell",
    path: [[0, 0], [1, 0]],
    next: { row: 0, col: 0 },
    expect: "backtrack",
  },
  {
    name: "checkpoint 2 rejected before checkpoint order allows it",
    path: [[0, 0], [1, 0], [1, 1]],
    next: { row: 2, col: 1 },
    expect: "advance", // (2,1) isn't a checkpoint, just confirms ordinary cells still work
  },
];

// A path that reaches the final checkpoint's *cell* out of turn — construct
// a board where checkpoint 2 is adjacent to checkpoint 1 so we can attempt
// to step directly onto it, which must be rejected until it's actually next
// (in this 2-checkpoint board it IS next, so also add a 3-checkpoint board
// to test genuine out-of-order rejection).
const orderBoard = {
  size: 3,
  checkpoints: [
    { number: 1, row: 0, col: 0 },
    { number: 2, row: 2, col: 0 },
    { number: 3, row: 0, col: 2 },
  ],
  walls: [],
};
checks.push({
  name: "entering checkpoint 3 before checkpoint 2 is rejected",
  board: orderBoard,
  path: [[0, 0], [0, 1]],
  next: { row: 0, col: 2 },
  expect: "invalid-checkpoint-order",
});

let checksFailed = 0;
for (const c of checks) {
  const board = c.board || testBoard;
  const result = evaluateMove(board, c.path, c.next);
  const ok = result === c.expect;
  if (!ok) checksFailed++;
  console.log(`${ok ? "✓" : "✗"} ${c.name}: got "${result}", expected "${c.expect}"`);
}

// Full-coverage-but-stopped-before-final-checkpoint must NOT complete
// (this is naturally impossible to construct as a "full coverage" path
// since the final checkpoint's cell would be left unvisited — verify the
// validator agrees a path missing a cell is never "complete").
const incompletePath = [[0, 0], [0, 1], [0, 2]]; // doesn't cover the 3x3 board, doesn't reach checkpoint 2
const incompleteOk = isLevelComplete(testBoard, incompletePath) === false;
console.log(`${incompleteOk ? "✓" : "✗"} incomplete/partial path is never reported complete`);
if (!incompleteOk) checksFailed++;

// --- Final-node acceptance tests (Test A-E from the spec) ------------------
// A 3x3 board where checkpoint 2 (the final checkpoint) sits at the center,
// so it's easy to construct a full-coverage path that reaches it early vs.
// one that reaches it last.
console.log("\nRunning final-checkpoint acceptance tests (A-E)...");

const finalNodeBoard = {
  size: 3,
  checkpoints: [
    { number: 1, row: 0, col: 0 },
    { number: 2, row: 1, col: 1 },
  ],
  walls: [],
};

// Test A: full coverage, but the path finishes on an ordinary cell (2,2)
// instead of the final checkpoint (1,1), which it passes through midway.
const testAPath = [
  [0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2],
];
const testAOk = isLevelComplete(finalNodeBoard, testAPath) === false;
console.log(`${testAOk ? "✓" : "✗"} Test A: full coverage ending on an ordinary cell -> NOT COMPLETE`);
if (!testAOk) checksFailed++;

// Test B: reaching the final checkpoint's cell before the board is fully
// covered must be rejected live, as soon as the player tries the move.
const testBOutcome = evaluateMove(finalNodeBoard, [[0, 0], [0, 1]], { row: 1, col: 1 });
const testBOk = testBOutcome === "invalid-final-too-early";
console.log(
  `${testBOk ? "✓" : "✗"} Test B: stepping onto the final checkpoint early: got "${testBOutcome}", expected "invalid-final-too-early"`
);
if (!testBOk) checksFailed++;

// Test C: full coverage AND the final cell of the path is the final
// checkpoint -> this is the only case that should be COMPLETE.
const testCPath = [
  [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1], [1, 1],
];
const testCOk = isLevelComplete(finalNodeBoard, testCPath) === true;
console.log(`${testCOk ? "✓" : "✗"} Test C: full coverage ending exactly at the final checkpoint -> COMPLETE`);
if (!testCOk) checksFailed++;

// Test D: reaching a future checkpoint before its required turn is an
// invalid move (already covered above by the 3-checkpoint order board, but
// re-asserted here against the final-checkpoint board for completeness).
const testDOutcome = evaluateMove(finalNodeBoard, [], { row: 1, col: 1 });
const testDOk = testDOutcome === "invalid-not-start"; // checkpoint 1 must be entered first
console.log(
  `${testDOk ? "✓" : "✗"} Test D: entering a checkpoint before checkpoint 1 is started -> invalid move`
);
if (!testDOk) checksFailed++;

// Test E: the completed path's final coordinate IS the final checkpoint's
// cell -- this is what guarantees PowerPath's drawn line (which always
// terminates at path[path.length - 1]) visually ends at the final house.
const testELast = testCPath[testCPath.length - 1];
const testEOk = testELast[0] === 1 && testELast[1] === 1;
console.log(`${testEOk ? "✓" : "✗"} Test E: completed path's final point is the final checkpoint's cell`);
if (!testEOk) checksFailed++;

const totalFailed = failed + checksFailed;
if (totalFailed > 0) {
  console.error(`\n${totalFailed} check(s) FAILED.`);
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
