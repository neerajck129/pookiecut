// Fully decorative, low-cost background: a handful of CSS-animated shapes
// rather than a particle system or heavy SVG. brightness controls how lit
// the distant village looks (0 = full power cut, 1 = power restored).
export default function VillageBackground({ brightness = 0 }) {
  return (
    <div className="kc-bg" style={{ "--kc-brightness": brightness }} aria-hidden="true">
      <div className="kc-bg__sky" />
      <div className="kc-bg__moon" />
      <div className="kc-bg__stars" />
      <svg className="kc-bg__silhouette" viewBox="0 0 400 90" preserveAspectRatio="none">
        <polyline
          className="kc-bg__wire"
          points="0,20 40,20 40,8 60,8 60,22 110,22 110,10 130,10 130,24 190,24 190,9 210,9 210,25 270,25 270,11 290,11 290,23 340,23 340,9 360,9 360,26 400,26"
          fill="none"
        />
        <rect x="38" y="20" width="4" height="70" className="kc-bg__pole" />
        <rect x="128" y="22" width="4" height="68" className="kc-bg__pole" />
        <rect x="208" y="23" width="4" height="67" className="kc-bg__pole" />
        <rect x="288" y="21" width="4" height="69" className="kc-bg__pole" />
        <rect x="358" y="24" width="4" height="66" className="kc-bg__pole" />

        {/* house silhouettes with a couple of windows that flicker independently */}
        {[
          { x: 10, w: 30 },
          { x: 70, w: 24 },
          { x: 150, w: 34 },
          { x: 230, w: 26 },
          { x: 310, w: 30 },
          { x: 365, w: 22 },
        ].map((h, i) => (
          <g key={i} transform={`translate(${h.x}, 46)`}>
            <polygon
              className="kc-bg__house"
              points={`0,20 0,44 ${h.w},44 ${h.w},20 ${h.w / 2},4`}
            />
            <rect
              className={`kc-bg__window kc-bg__window--${i % 3}`}
              x={h.w * 0.3}
              y={28}
              width={h.w * 0.18}
              height={h.w * 0.18}
            />
          </g>
        ))}

        {/* coconut trees */}
        {[20, 200, 380].map((x, i) => (
          <g key={i} className="kc-bg__tree" transform={`translate(${x}, 30)`}>
            <path d="M0 0 C -2 20, -1 40, 1 60" className="kc-bg__trunk" fill="none" />
            <g className="kc-bg__fronds">
              <path d="M0 0 C -14 -6, -22 2, -26 10" fill="none" />
              <path d="M0 0 C 14 -6, 22 2, 26 10" fill="none" />
              <path d="M0 0 C -6 -14, 2 -20, 10 -22" fill="none" />
              <path d="M0 0 C 6 -14, -2 -20, -10 -22" fill="none" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
