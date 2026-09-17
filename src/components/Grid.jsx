import { getCellRect } from "../game/geometry.js";

export default function Grid({ size, cellSize, visitedSet, rejectFlash }) {
  const cells = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rect = getCellRect(r, c, cellSize);
      const isVisited = visitedSet.has(`${r},${c}`);
      const isRejecting = rejectFlash && rejectFlash.row === r && rejectFlash.col === c;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={cellSize * 0.12}
          className={
            "kc-cell" +
            (isVisited ? " kc-cell--visited" : "") +
            (isRejecting ? " kc-cell--reject" : "")
          }
        />
      );
    }
  }

  return <g className="kc-grid">{cells}</g>;
}
