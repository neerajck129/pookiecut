# ⚡ KSEB CONNECT

A minimalist, LinkedIn Zip-style path puzzle themed around Kerala power
cuts — connect KSEB to every numbered house, in order, covering the whole
grid, without crossing your own line or a wall. Built with React + Vite,
mobile-first, no backend.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

Deploys to Vercel with zero configuration (static Vite build, no server
functions, no environment variables).

## The puzzle model

The player draws one continuous orthogonal path starting at checkpoint 1
(KSEB). To win, the path must:

- cover **every** cell in the grid exactly once (a Hamiltonian path),
- never cross a wall or revisit a cell,
- and reach checkpoints 2, 3, 4... in strictly ascending numeric order —
  entering a future checkpoint before its turn is rejected the instant you
  try it, not just at the end.

Walls are edges between two adjacent cells, not removed squares — every
cell in the grid is always visitable, just not always directly from every
neighbor.

## Project structure

```
src/
├── components/
│   ├── GameBoard.jsx          responsive SVG board, owns pointer interaction
│   ├── Grid.jsx                cell backgrounds / gridlines
│   ├── Wall.jsx                 wall edges, rendered on cell boundaries
│   ├── PowerPath.jsx           the drawn line (SVG, animated pulse)
│   ├── House.jsx                house icon + integrated number badge
│   ├── KsebSource.jsx          KSEB icon + integrated "1" badge
│   ├── VillageBackground.jsx   decorative night-village atmosphere
│   ├── LevelHeader.jsx         top bar
│   └── LevelComplete.jsx       "POWER RESTORED" success overlay
│
├── game/               pure logic, no React, no DOM — unit-testable
│   ├── geometry.js          ONE shared cell-coordinate system (see below)
│   ├── pathUtils.js         grid helpers, wall edges, canMove(), flood fill
│   ├── solver.js            exact DFS+backtracking solver (source of truth)
│   ├── validator.js         runtime move + win-condition validation
│   ├── generator.js         checkpoints-first + wall-carving generator
│   └── difficulty.js        difficulty score from measured solver stats
│
├── hooks/
│   └── usePointerPath.js    screen-coords -> board-coords drag handling
│
├── levels/
│   ├── levelConfigs.js      per-level generation parameters (progression)
│   └── levels.js            AUTO-GENERATED, do not hand-edit (see below)
│
├── App.jsx             level progression state machine
├── main.jsx
└── styles.css
```

## Regenerating levels

```bash
npm run generate-levels   # regenerate src/levels/levels.js from scratch
npm run test-levels       # independently re-verify every level + run
                           # validator unit checks
```

Every shipped level has been proven to have **exactly one solution** by the
exact solver before being written to `src/levels/levels.js`, then
independently re-verified by a separate script.

---

## What changed in this revision, and why

This was a rewrite of the puzzle's actual mathematics and grid geometry,
not a visual pass. Summary for anyone picking this project back up:

### 1. The generator no longer builds a path first

**Old approach (removed):** walk a random Hamiltonian path over the grid,
then read off checkpoint positions from cells along that path. This
produces a puzzle shaped *around* a pre-existing answer — houses never
actually constrain anything beyond "must be reached eventually", so most
boards ended up with several valid solutions.

**New approach (`src/game/generator.js`):**

```
place checkpoints directly on the grid (independent of any path)
        ↓
solve the open grid with the exact solver
        ↓
solution count == 1? -> accept
        ↓
otherwise: propose one wall edge, keep it only if the puzzle is
still solvable with it in place, re-solve, repeat
        ↓
solution count == 1? -> accept
otherwise (after the attempt budget): discard this checkpoint
placement entirely and try a fresh one
```

This is a real "carve down to uniqueness" generator: checkpoints are
placed first, walls are added incrementally and only kept when the solver
confirms they don't break solvability, and the solver is consulted after
every single change. All 30 shipped levels have a solver-verified unique
solution — I removed the old fallback that shipped a level with "at least
2 solutions" when uniqueness couldn't be found in time; a level that
doesn't reach uniqueness within budget is discarded and regenerated from a
different checkpoint placement instead.

### 2. Walls are edges, not missing cells

**Old model:** `blocked: [{row, col}]` — a fully unusable square.
**New model:** `walls: [{row, col, direction}]` — a blocked connection
between two adjacent cells. Both cells stay usable and must still be
covered by the path; they just can't be entered directly from that one
side. `canMove(fromRow, fromCol, toRow, toCol, size, wallSet)` in
`pathUtils.js` is the single movement-legality function, and it's the
*only* one — the solver, the validator's live move-checking, and (through
the validator) the player's drag interaction all call the same function,
so they can never disagree about what's legal.

### 3. Checkpoint order is enforced live, not just at the end

`evaluateMove()` in `validator.js` now checks, on every single proposed
step, whether the destination cell is a checkpoint and whether it's the
*next required* one. Stepping onto checkpoint 3 while checkpoint 2 hasn't
been reached yet returns `"invalid-checkpoint-order"` and the move is
rejected with the same red-flash feedback as any other illegal move — it
never enters the path. This replaced the old behavior of only checking
order retroactively once the whole grid was covered (which used to show a
"reached in wrong order" nudge after the fact; that UI is gone because the
state it described is no longer reachable).

The solver enforces the same rule during search (pruning any DFS branch
that steps onto an out-of-sequence checkpoint), so "checkpoint order" is
one rule implemented once conceptually, checked by two independent code
paths (search-time pruning vs. live move validation) that are tested
against each other in `scripts/testLevels.js`.

### 4. One shared coordinate system (`src/game/geometry.js`)

Previously each component computed `(col + 0.5) * cellSize` inline. It was
mathematically consistent, but nothing enforced that, and it's how the
label-sizing bug below slipped in. Now `getCellCenter`, `getCellRect`, and
`getEdgeSegment` are the only source of position for the grid, the path,
walls, houses, and KSEB — every component imports the same three
functions rather than deriving its own offsets.

### 5. House / KSEB containment fix

This was a real bug, not just a style tweak: the old house's number label
used a **fixed pixel font-size in the outer SVG coordinate space**
(`font-size: 9px` inside a `viewBox="0 0 100 100"`), independent of
`cellSize`. On the 4x4–6x6 boards already shipped this happened to look
fine, but it would have overflowed badly on denser grids, and the label's
vertical offset wasn't guaranteed to stay inside the cell either.

`House.jsx` and `KsebSource.jsx` are now built as **one glyph**: the icon
and its number badge are authored together in a local 0–100 art box, then
that whole box is scaled down as a single unit to a fixed 78% of the
cell's size and centered on the cell (via `getCellCenter`). Because the
scale factor is derived from `cellSize` and applied to the entire glyph at
once (including the badge's font-size, which is now specified inside the
scaled local coordinate space instead of the outer one), the glyph is
mathematically guaranteed to occupy the same *proportion* of every cell
regardless of grid size — confirmed visually on both a 4x4 board and a
dense 6x6/8-checkpoint board, no overflow at either.

I also simplified KSEB's glyph to a bolt icon + circled "1" (dropped the
"KSEB" wordmark from inside the cell) — at small cell sizes on denser
boards, fitting three extra letters inside the same safe box wasn't
worth the containment risk, and the header already identifies the game.

### 6. Removed dead/conflicting code

- `BlockedCell.jsx` and all blocked-cell CSS — replaced by `Wall.jsx`.
- The "next expected house" glow/UI hint — the spec asked for numbers
  alone to communicate sequence, so this is gone from both the component
  props and the CSS.
- The old wrong-order-after-full-coverage nudge banner in `App.jsx` — with
  live rejection, a path can no longer reach full coverage with checkpoints
  out of order, so the state that banner described is unreachable.
- `src/game/generator.js`'s old path-first logic, `houseCount`/`blockedCount`
  fields throughout `difficulty.js`, and the old `start`/`houses`/`blocked`
  level shape — nothing in the codebase references the old model anymore.

## Manual acceptance testing performed

All ten scenarios from the acceptance checklist were run against the built
app with a real headless browser driving actual pointer drag events (not
just unit tests calling functions directly):

1. A simple `1 → 2 → 3` puzzle completes, houses light up, "POWER RESTORED"
   shows, and the game auto-advances to the next level. ✓
2. Entering checkpoint 3 before checkpoint 2 is rejected in real time (red
   flash on that cell, path unchanged). ✓
3. Revisiting an old cell (not the immediate previous one) is rejected. ✓
4. True diagonal single-step moves are rejected (`evaluateMove` unit test);
   fast diagonal-looking drags are decomposed into individual orthogonal
   steps, each independently validated, per the "forgiving touch" spec —
   this is intentional, not a bypass. ✓
5. Crossing a wall is rejected, symmetrically from either side. ✓
6. Backtracking one step (stepping onto the immediately previous cell)
   correctly pops the path back. ✓
7. Full-grid coverage that skips the final checkpoint is structurally
   impossible under live order-enforcement (the final checkpoint's cell
   can't be left unvisited if every cell must be covered), and
   `isLevelComplete()` independently re-verifies order from scratch as a
   defensive second check regardless. ✓
8. All houses and KSEB stay visually inside their cells, checked on both a
   4x4 board and a dense 6x6/8-checkpoint board. ✓
9. Resized from 320px through desktop width — grid stays square, no
   horizontal scroll at any of the required breakpoints, KSEB/houses/path/
   walls all stay aligned. ✓
10. All 30 production levels re-verified independently
    (`npm run test-levels`) — every one has exactly one solution; none
    with 0 or 2+ made it into `levels.js`. ✓

## Known limitations

- **Grid size capped at 6x6 for shipped levels.** The checkpoints-first +
  wall-carving generator is correct but more expensive than the old
  path-first approach, since it re-solves the puzzle after every wall
  candidate. In testing, 7x7 boards took anywhere from ~8 to ~75 seconds
  per level depending on checkpoint placement, which is too slow/unreliable
  for confident batch generation at this budget. 4x4–6x6 levels generate
  in well under 2 seconds each. Extending to 7x7+ is possible but would
  need either a smarter wall-candidate heuristic (e.g. preferring edges
  near existing walls to carve more targeted corridors) or a larger
  generation time budget accepted up front.
- Difficulty (1–10 stars) is derived from grid size, checkpoint density,
  wall count, and the solver's own search behavior — it's a reasonable
  proxy, not a guarantee of human-perceived difficulty.
