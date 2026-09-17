import { getCellCenter } from "../game/geometry.js";

// The house icon and its number badge are drawn as ONE glyph in a local
// 0-100 art box, then scaled down as a single unit to CONTENT_RATIO of the
// cell and centered on the cell's center. Because every part of the art is
// authored well inside that 0-100 box (see the bounding comments below),
// the whole glyph is mathematically guaranteed to fit inside CONTENT_RATIO
// of the cell, regardless of grid size — it can never cross into a
// neighboring cell.
const CONTENT_RATIO = 0.78;

export default function House({ row, col, cellSize, number, isPowered }) {
  const { x: cx, y: cy } = getCellCenter(row, col, cellSize);
  const contentSize = cellSize * CONTENT_RATIO;
  const scale = contentSize / 100;
  const offset = contentSize / 2;

  return (
    <g
      className={"kc-house" + (isPowered ? " kc-house--lit" : "")}
      transform={`translate(${cx}, ${cy})`}
    >
      {isPowered && <circle className="kc-house__glow" r={contentSize * 0.55} />}
      {/* local art box: x spans 14-86, y spans 10-98 (bounding box comment above) */}
      <g transform={`translate(${-offset}, ${-offset}) scale(${scale})`}>
        <path
          className="kc-house__roof"
          d="M50,10 L86,40 L76,40 L76,46 L24,46 L24,40 L14,40 Z"
        />
        <rect className="kc-house__body" x="24" y="46" width="52" height="30" rx="2" />
        <rect className="kc-house__window kc-house__window--l" x="31" y="52" width="12" height="12" rx="1.5" />
        <rect className="kc-house__window kc-house__window--r" x="57" y="52" width="12" height="12" rx="1.5" />
        {/* number integrated directly onto the house, not floating separately */}
        <circle className="kc-house__badge" cx="50" cy="87" r="11" />
        <text
          className="kc-house__badge-label"
          x="50"
          y="88"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {number}
        </text>
      </g>
    </g>
  );
}
