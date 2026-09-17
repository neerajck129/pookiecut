// Difficulty is derived from measurable properties of the puzzle and the
// solver's own search behaviour, not assigned by hand.
//
// Inputs used:
//   - grid size (bigger boards are harder to hold in your head)
//   - checkpoint count relative to grid (fewer checkpoints -> more freedom
//     for the player to go wrong -> harder, up to a point)
//   - wall count (more walls -> more constrained routing, but also more
//     guidance, so this is a moderate contributor, not dominant)
//   - branchPoints / totalBranches from the solver (how often the solver
//     had a real choice while proving the puzzle -> proxy for how much a
//     human has to plan ahead)
//   - nodesExplored relative to board size (how hard the solver had to
//     search to prove the single valid answer -> proxy for human effort)

export function scoreDifficulty({ size, checkpointCount, wallCount, solverResult }) {
  const totalCells = size * size;
  const { branchPoints, totalBranches, nodesExplored } = solverResult;

  const sizeScore = (size - 4) * 6; // 4x4 -> 0, 9x9 -> 30
  const checkpointDensity = checkpointCount / totalCells;
  const checkpointScore = (1 - Math.min(checkpointDensity * 6, 1)) * 20; // sparser checkpoints -> harder
  const wallScore = Math.min(wallCount * 1.6, 18);

  const avgBranch = branchPoints > 0 ? totalBranches / branchPoints : 0;
  const branchScore = Math.min(branchPoints * 1.2 + avgBranch * 3, 25);

  const searchIntensity = nodesExplored / totalCells;
  const searchScore = Math.min(Math.log2(searchIntensity + 1) * 6, 20);

  const raw = sizeScore + checkpointScore + wallScore + branchScore + searchScore;

  const stars = Math.max(1, Math.min(10, Math.round(raw / 11.5)));

  return {
    stars,
    raw: round1(raw),
    breakdown: {
      sizeScore: round1(sizeScore),
      checkpointScore: round1(checkpointScore),
      wallScore: round1(wallScore),
      branchScore: round1(branchScore),
      searchScore: round1(searchScore),
    },
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
