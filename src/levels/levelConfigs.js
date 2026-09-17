// Progression plan (see project spec):
//   Levels 1-5   -> 4x4, teach the mechanic
//   Levels 6-15  -> 5x5, more checkpoints, first walls appear
//   Levels 16-30 -> 6x6, more checkpoints + walls, harder branching
//
// checkpointCount includes checkpoint 1 (KSEB) itself, so a level with
// checkpointCount=4 has KSEB + 3 numbered houses. Counts increase gradually
// within each band so difficulty grows smoothly rather than jumping at
// each grid-size boundary. Grid size is deliberately capped at 6x6 for
// shipped levels — see README for why 7x7+ isn't included yet.

function band(startId, endId, size, checkpointRange) {
  const configs = [];
  const count = endId - startId + 1;
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const t = count === 1 ? 0 : i / (count - 1);
    const checkpointCount = Math.round(
      checkpointRange[0] + t * (checkpointRange[1] - checkpointRange[0])
    );
    configs.push({
      id,
      size,
      checkpointCount: Math.max(2, checkpointCount),
    });
  }
  return configs;
}

export function buildLevelConfigs() {
  return [
    ...band(1, 5, 4, [3, 4]),
    ...band(6, 15, 5, [4, 6]),
    ...band(16, 30, 6, [5, 8]),
  ];
}
