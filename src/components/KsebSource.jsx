import { getCellCenter } from "../game/geometry.js";

// Same containment guarantee as House.jsx: one glyph (bolt icon + "1"
// badge), authored inside a local 0-100 art box (bounding: x 28-74,
// y 6-98), scaled as a single unit to CONTENT_RATIO of the cell.
const CONTENT_RATIO = 0.78;

export default function KsebSource({ row, col, cellSize }) {
  const { x: cx, y: cy } = getCellCenter(row, col, cellSize);
  const contentSize = cellSize * CONTENT_RATIO;
  const scale = contentSize / 100;
  const offset = contentSize / 2;

  return (
    <g className="kc-source" transform={`translate(${cx}, ${cy})`}>
      <circle className="kc-source__ring" r={contentSize * 0.58} />
      <g transform={`translate(${-offset}, ${-offset}) scale(${scale})`}>
        <path className="kc-source__bolt" d="M58,6 L28,46 L44,46 L38,74 L74,34 L52,34 Z" />
        <circle className="kc-source__badge" cx="50" cy="87" r="11" />
        <text
          className="kc-source__badge-label"
          x="50"
          y="88"
          textAnchor="middle"
          dominantBaseline="central"
        >
          1
        </text>
      </g>
    </g>
  );
}
