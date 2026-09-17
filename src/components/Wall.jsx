import { getEdgeSegment } from "../game/geometry.js";

// Renders every wall exactly on the shared edge between two cells, using
// the same geometry system as everything else on the board — never as a
// graphic sitting inside a cell.
export default function Wall({ walls, cellSize }) {
  return (
    <g className="kc-walls">
      {walls.map((wall, i) => {
        const seg = getEdgeSegment(wall.row, wall.col, wall.direction, cellSize);
        return (
          <line
            key={`${wall.row}-${wall.col}-${wall.direction}-${i}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            className="kc-wall"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}
