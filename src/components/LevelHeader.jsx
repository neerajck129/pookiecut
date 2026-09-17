export default function LevelHeader({ levelNumber, moves, poweredHouseCount, houseCount }) {
  const label = String(levelNumber).padStart(2, "0");
  const showProgress = typeof houseCount === "number" && houseCount > 0;
  return (
    <header className="kc-header">
      <div className="kc-header__title">
        <span className="kc-header__bolt">⚡</span>
        <span>POOKIE PUZZLE</span>
      </div>
      <div className="kc-header__meta">
        <span className="kc-header__level">LEVEL {label}</span>
        {showProgress && (
          <span className="kc-header__progress" aria-label={`${poweredHouseCount} of ${houseCount} houses powered`}>
            {poweredHouseCount}/{houseCount} lit
          </span>
        )}
        {typeof moves === "number" && (
          <span className="kc-header__moves">{moves} moves</span>
        )}
      </div>
    </header>
  );
}
