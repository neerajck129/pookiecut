export default function GameZoneCard({ onStart }) {
  return (
    <div className="pc-card pc-card--game">
      <div className="pc-card__eyebrow">⚡ GAME ZONE</div>
      <h3 className="pc-card__title">POOKIE PUZZLE</h3>
      <p className="pc-card__desc">
        Current പോയി.
        <br />
        KSEB-ൽ നിന്ന് ഓരോ വീട്ടിലേക്കും
        <br />
        കറന്റ് എത്തിക്കാമോ?
      </p>
      <button type="button" className="pc-card__cta pc-card__cta--primary" onClick={onStart}>
        START GAME →
      </button>
    </div>
  );
}
