export default function LevelComplete({ visible, nextLevelNumber, onSkip }) {
  return (
    <div
      className={"kc-complete" + (visible ? " kc-complete--visible" : "")}
      aria-live="polite"
      onClick={visible ? onSkip : undefined}
    >
      <div className="kc-complete__card">
        <div className="kc-complete__bolt">⚡</div>
        <div className="kc-complete__title">POWER RESTORED</div>
        {typeof nextLevelNumber === "number" && (
          <div className="kc-complete__next">LEVEL {String(nextLevelNumber).padStart(2, "0")}</div>
        )}
        <div className="kc-complete__hint">Tap to continue</div>
      </div>
    </div>
  );
}
