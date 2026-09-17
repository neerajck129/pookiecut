import { getCellCenter } from "../game/geometry.js";

export default function PowerPath({ path, cellSize, isComplete }) {
  if (path.length < 2) return null;

  const toXY = ([r, c]) => getCellCenter(r, c, cellSize);

  const points = path.map(toXY);
  const d = points
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  return (
    <g className={"kc-path" + (isComplete ? " kc-path--complete" : "")}>
      <path
        d={d}
        className="kc-path__glow"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        className="kc-path__line"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        className="kc-path__pulse"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
